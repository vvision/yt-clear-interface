/** ytClearInterface. Clear Youtube interface by hiding some of its components.
 * Copyright (C) 2021  Victor VOISIN

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Identifiers
 */
const identifiers = [
  {
    id: 'CLARIFY_BOX',
    optionName: 'hideClarifyBox',
    selector: '#clarify-box',
    shouldBeHidden: false,
  },
  {
    id: 'SUGGESTIONS',
    optionName: 'hideSuggestions',
    selector: '#secondary', // 'items' usable too.
    shouldBeHidden: false,
  },
  {
    id: 'END_SCREEN',
    optionName: 'hideEndScreen',
    selector: '.ytp-endscreen-content',
    shouldBeHidden: false,
  },
  {
    id: 'COMMENTS',
    optionName: 'hideComments',
    selector: '#comments',
    shouldBeHidden: false,
  },
  {
    id: 'DONATION_SHELF',
    optionName: 'hideDonation',
    selector: '#donation-shelf',
    shouldBeHidden: false,
  },
  {
    id: 'MAIN_SCREEN_CONTENTS',
    optionName: 'hideMainContents',
    selector: '#contents',
    shouldBeHidden: false,
  },
];

/**
 * Is element available ?
 */
const isElementAvailable = selector => {
  return !!document.querySelector(selector);
};

/**
 * Is element hidden ?
 */
const isElementHidden = selector => {
  return document.querySelector(selector).hidden;
  // return document.querySelector(selector).style.display === 'none';
};

/**
 * Hide element
 */
const hideElement = selector => {
  document.querySelector(selector).hidden = true;
  // document.querySelector(selector).style.display = 'none';
};

/**
 * Wait for all elements to exist in DOM then hide them.
 */
let start = null;
const tryToHideElements = timestamp => {
  //
  let retry = false;
  // Compute runtime
  if (!start) {
    start = timestamp;
  }
  const runtime = timestamp - start;
  // Try to toggle only during 10s
  if (runtime < 10000) {
    for (const identifier of identifiers) {
      const { selector, shouldBeHidden } = identifier;
      if (shouldBeHidden && isElementAvailable(selector)) {
        if (!isElementHidden(selector)) {
          logStep(`Hide element with selector : ${selector}`);
          hideElement(selector);
        }
      } else {
        logStep(`Retry for element with selector : ${selector}`);
        retry = true;
      }
    }

    if (retry) {
      logStep('Waiting for some elements. Retrying later.');
      setTimeout(() => {
        window.requestAnimationFrame(tryToHideElements);
      }, 50);
    }
  }
};

/**
 * Error logger
 */
const logStorageErrorAndFallback = error => {
  console.error(`Error: ${error}`);
};

/**
 * Get settings and execute
 * Doc: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get
 */
const options = identifiers.map(e => e.optionName);
logStep(`Options are: ${JSON.stringify(options)}`);
browser.storage.sync.get(options).then(settings => {
  logStep(`Storage contains: ${JSON.stringify(settings)}`);

  for (const identifier of identifiers) {
    if (settings[identifier.optionName]) {
      identifier.shouldBeHidden = true;
    }
  }
  window.requestAnimationFrame(tryToHideElements);
}, logStorageErrorAndFallback);

/**
 * Observe DOM to remove comments if needed
 */
// Select the node that will be observed for mutations
// const targetNode = document.getElementById('columns');
// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      if (mutation.target.nodeName.toLowerCase().includes('ytd-comments')) {
        logStep('A child node related to comments has changed.');
        logStep(mutation);

        const commentsIdentifier = identifiers.filter(
          identifier => identifier.id === 'COMMENTS',
        )[0];
        if (commentsIdentifier.shouldBeHidden) {
          hideElement('#comments');
        }
        observer.disconnect();
      }
    }
  }
};
// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
// Start observing the target node for configured mutations
observer.observe(document.body /* targetNode */, config);
