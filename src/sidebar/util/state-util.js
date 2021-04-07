'use strict';

/**
 * Returns the documentFingerprint (DC identifier) when available in the frames state
 * @param store
 * @returns {String}
 *  sample urn:x-dc:inspera.com%2Fgrading%2F2374014%2F2338909%2F2374023
 */
function getDCIdentifier(store) {
  const state = store.getState();
  const metaFrame = state.frames.find(function (frame) {
    return frame.metadata && frame.metadata.documentFingerprint;
  });

  return metaFrame ? metaFrame.metadata.documentFingerprint : null;
}

/**
 * Returns the documentFingerprint (DC identifier) when available in the frames state
 * @param store
 * @returns {Promise<T>}
 */
function getDocumentDCIdentifier(store) {
  function getIdentifier() {
    return getDCIdentifier(store);
  }
  return awaitStateChange(store, getIdentifier);
}

/* URN Format for deliveries:
 * urn:x-dc:inspera.com/grading/[assessmentRunId]/[questionId]/[partyId] => delivery tab
 * urn:x-dc:inspera.com/grading/[assessmentRunId]/[questionId] => question tab
 * urn:x-dc:inspera.com/grading/[assessmentRunId]/[partyId]/attachment/[attachmentCiId] => attachment tab
* */
/**
 * Get the current active pane where annotation was saved.
 * @param store
 * sample urn:x-dc:inspera.com%2Fgrading%2F2374014%2F2338909%2F2374023
 * @return {String} The active tab/pane.
 */
function getFocusedGroupStorageKeyFromUrn(store) {
  const STORAGE_KEY = 'hypothesis.groups.focus';
  const urn = getDCIdentifier(store);
  const decodedUrn = decodeURIComponent(urn).split('/');
  const assessmentRunId = decodedUrn[2];
  switch (decodedUrn.length) {
    case 5:
      return `${assessmentRunId}_submission_${STORAGE_KEY}`;
    case 4:
      return `${assessmentRunId}_questionPreview_${STORAGE_KEY}`;
    case 6:
      return `${assessmentRunId}_attachment_${STORAGE_KEY}`;
  }
  return undefined;
}

/**
 * Return a value from app state when it meets certain criteria.
 *
 * `await` returns a Promise which resolves when a selector function,
 * which reads values from a Redux store, returns non-null.
 *
 * @param {Object} store - Redux store
 * @param {Function<T|null>} selector - Function which returns a value from the
 *   store if the criteria is met or `null` otherwise.
 * @return {Promise<T>}
 */
function awaitStateChange(store, selector) {
  const result = selector(store);
  if (result !== null) {
    return Promise.resolve(result);
  }
  return new Promise(resolve => {
    const unsubscribe = store.subscribe(() => {
      const result = selector(store);
      if (result !== null) {
        unsubscribe();
        resolve(result);
      }
    });
  });
}

// urn format: urn:x-dc:inspera.com/ib%2F58251620
/**
* Check the hypothesis app is used in authoring or not.
*
* @param {Object} store - Redux store
* @return {Boolean} true/false.
 *
* */
function isAuthoringContext(store) {
  const urn = getDCIdentifier(store);
  const decodedUrn = decodeURIComponent(urn).split('/');
  const context = decodedUrn[1];

  return context === 'ib';
}
module.exports = { awaitStateChange, getDocumentDCIdentifier, getFocusedGroupStorageKeyFromUrn, isAuthoringContext } ;
