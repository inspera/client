import { createElement, render } from 'preact';

import AdderToolbar from './components/adder-toolbar';
import Actions from './actions';

/**
 * @typedef Target
 * @prop {number} left - Offset from left edge of viewport.
 * @prop {number} top - Offset from top edge of viewport.
 * @prop {number} arrowDirection - Direction of the adder's arrow.
 */

/**
 * Show the adder above the selection with an arrow pointing down at the
 * selected text.
 */
export const ARROW_POINTING_DOWN = 1;

/**
 * Show the adder above the selection with an arrow pointing up at the
 * selected text.
 */
export const ARROW_POINTING_UP = 2;

function toPx(pixels) {
  return pixels.toString() + 'px';
}

const ARROW_HEIGHT = 10;

// The preferred gap between the end of the text selection and the adder's
// arrow position.
const ARROW_H_MARGIN = 20;

const { ANNOTATE, HIGHLIGHT } = Actions;

/**
 * Return the closest ancestor of `el` which has been positioned.
 *
 * If no ancestor has been positioned, returns the root element.
 *
 * @param {Element} el
 * @return {Element}
 */
function nearestPositionedAncestor(el) {
  let parentEl = /** @type {Element} */ (el.parentElement);
  while (parentEl.parentElement) {
    if (getComputedStyle(parentEl).position !== 'static') {
      break;
    }
    parentEl = parentEl.parentElement;
  }
  return parentEl;
}

/**
 * @typedef AdderOptions
 * @prop {() => any} onAnnotate - Callback invoked when "Annotate" button is clicked
 * @prop {() => any} onHighlight - Callback invoked when "Highlight" button is clicked
 * @prop {(annotations: Object[]) => any} onShowAnnotations -
 *   Callback invoked when  "Show" button is clicked
 * @prop {() => any} onRemoveHighlight - Callback invoked when "Delete Highlight" button is clicked
 * @prop {boolean} disableShowButton - whether to hide the show button
 * @prop {Object} captions - translated captions
 */

/**
 * Container for the 'adder' toolbar which provides controls for the user to
 * annotate and highlight the selected text.
 *
 * The toolbar implementation is split between this class, which is
 * the container for the toolbar that positions it on the page and isolates
 * it from the page's styles using shadow DOM, and the `AdderToolbar` Preact
 * component which actually renders the toolbar.
 */
export class Adder {
  /**
   * Create the toolbar's container and hide it.
   *
   * The adder is initially hidden.
   *
   * @param {HTMLElement} container - The DOM element into which the adder will be created
   * @param {AdderOptions} options - Options object specifying `onAnnotate` and `onHighlight`
   *        event handlers.
   */
  constructor(container, options) {
    this._container = container;
    this._captions = options.captions || {};

    // Set initial style
    Object.assign(container.style, {
      display: 'block',

      // take position out of layout flow initially
      position: 'absolute',
      top: 0,

      // Assign a high Z-index so that the adder shows above any content on the
      // page
      zIndex: 999,
    });

    this._view = /** @type {Window} */ (container.ownerDocument.defaultView);

    this._width = () => {
      const firstChild = /** @type {Element} */ (this._container.firstChild);
      return firstChild.getBoundingClientRect().width;
    };

    this._height = () => {
      const firstChild = /** @type {Element} */ (this._container.firstChild);
      return firstChild.getBoundingClientRect().height;
    };

    this._isVisible = false;

    /** @type {'up'|'down'} */
    this._arrowDirection = 'up';

    this._onAnnotate = options.onAnnotate;
    this._onHighlight = options.onHighlight;
    this._onShowAnnotations = options.onShowAnnotations;
    this._onRemoveHighlight = options.onRemoveHighlight;

    /**
     * Annotation objects associated with the current selection. If non-empty,
     * a "Show" button appears in the toolbar. Clicking the button calls the
     * `onShowAnnotations` callback with the current value of `annotationsForSelection`.
     *
     * @type {Object[]}
     */
    this.annotationsForSelection = [];

    this._render();
  }

  /** Hide the adder */
  hide() {
    this._isVisible = false;
    this._render();
  }

  /**
   *
   * @param {array} tools - List of buttons to show
   */
  setButtons(tools) {
    this._tools = tools;
    this._render();
  }

  /**
   * Return the best position to show the adder in order to target the
   * selected text in `targetRect`.
   *
   * @param {DOMRect} targetRect - The rect of text to target, in viewport
   *        coordinates.
   * @param {boolean} isSelectionBackwards - True if the selection was made
   *        backwards, such that the focus point is mosty likely at the top-left
   *        edge of `targetRect`.
   * @return {Target}
   */
  target(targetRect, isSelectionBackwards) {
    // Set the initial arrow direction based on whether the selection was made
    // forwards/upwards or downwards/backwards.

    let arrowDirection;
    if (isSelectionBackwards) {
      arrowDirection = ARROW_POINTING_DOWN;
    } else {
      arrowDirection = ARROW_POINTING_UP;
    }
    let top;
    let left;

    // Position the adder such that the arrow it is above or below the selection
    // and close to the end.
    const hMargin = Math.min(ARROW_H_MARGIN, targetRect.width);
    if (isSelectionBackwards) {
      left = targetRect.left - this._width() / 2 + hMargin;
    } else {
      left = targetRect.left + targetRect.width - this._width() / 2 - hMargin;
    }

    // Flip arrow direction if adder would appear above the top or below the
    // bottom of the viewport.
    if (
      targetRect.top - this._height() < 0 &&
      arrowDirection === ARROW_POINTING_DOWN
    ) {
      arrowDirection = ARROW_POINTING_UP;
    } else if (targetRect.top + this._height() > this._view.innerHeight) {
      arrowDirection = ARROW_POINTING_DOWN;
    }

    if (arrowDirection === ARROW_POINTING_UP) {
      top = targetRect.top + targetRect.height + ARROW_HEIGHT;
    } else {
      top = targetRect.top - this._height() - ARROW_HEIGHT;
    }

    // Constrain the adder to the viewport.
    left = Math.max(left, 0);
    left = Math.min(left, this._view.innerWidth - this._width());

    top = Math.max(top, 0);
    top = Math.min(top, this._view.innerHeight - this._height());

    return { top, left, arrowDirection };
  }

  focusedTarget(event) {
    const shift = Math.floor(this._width() / 2);
    const gap = 5;
    const rect = event.currentTarget.getBoundingClientRect();
    const maxX = rect.left + rect.width - gap - shift;
    let left = event.clientX - shift;
    let top;

    const maxY = this._view.innerHeight - this._height() - ARROW_HEIGHT - gap;
    const arrowDirection =
      event.clientY < maxY ? ARROW_POINTING_UP : ARROW_POINTING_DOWN;

    if (left < gap) {
      left = gap + ARROW_H_MARGIN;
    } else if (left + ARROW_H_MARGIN > maxX) {
      left = maxX - ARROW_H_MARGIN;
    } else {
      left += ARROW_H_MARGIN;
    }

    if (arrowDirection === ARROW_POINTING_UP) {
      top = event.clientY + ARROW_H_MARGIN;
    } else {
      top = event.clientY - this._height() - ARROW_HEIGHT;
    }

    return {
      left,
      top,
      arrowDirection,
    };
  }

  /**
   * Show the adder at the given position and with the arrow pointing in
   * `arrowDirection`.
   *
   * @param {number} left - Horizontal offset from left edge of viewport.
   * @param {number} top - Vertical offset from top edge of viewport.
   * @param {number} arrowDirection - Arrow direction
   */
  showAt(left, top, arrowDirection) {
    // Translate the (left, top) viewport coordinates into positions relative to
    // the adder's nearest positioned ancestor (NPA).
    //
    // Typically the adder is a child of the `<body>` and the NPA is the root
    // `<html>` element. However page styling may make the `<body>` positioned.
    // See https://github.com/hypothesis/client/issues/487.
    const positionedAncestor = nearestPositionedAncestor(this._container);
    const parentRect = positionedAncestor.getBoundingClientRect();

    Object.assign(this._container.style, {
      top: toPx(top - parentRect.top),
      left: toPx(left - parentRect.left),
    });

    this._isVisible = true;
    this._arrowDirection = arrowDirection === ARROW_POINTING_UP ? 'up' : 'down';
    this._render();
  }

  _prepareTools() {
    const toolsToShow = this._tools || [ANNOTATE, HIGHLIGHT];

    const existingTools = [
      {
        name: 'annotate',
        caption: this._captions.annotate || 'annotate',
        command: () => {
          this._onAnnotate();
          this.hide();
        },
        shortcut: this._isVisible ? 'a' : null,
      },
      {
        name: 'highlight',
        caption: this._captions.highlight || 'highlight',
        command: () => {
          this._onHighlight();
          this.hide();
        },
        shortcut: this._isVisible ? 'h' : null,
      },
      {
        name: 'show',
        caption: this._captions.show || 'show',
        command: () => {
          this._onShowAnnotations(this.annotationsForSelection);
        },
        shortcut: this._isVisible ? 's' : null,
      },
      {
        name: 'delete',
        caption: this._captions.delete || 'delete',
        icon: 'trash',
        command: () => {
          this._onRemoveHighlight();
          this.hide();
        },
        shortcut: this._isVisible ? 'd' : null,
      },
    ];

    return existingTools.filter(tool => toolsToShow.includes(tool.name));
  }

  _render() {
    render(
      <AdderToolbar
        isVisible={this._isVisible}
        arrowDirection={this._arrowDirection}
        tools={this._prepareTools()}
      />,
      this._container
    );
  }
}
