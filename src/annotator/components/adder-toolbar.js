import classnames from 'classnames';
import { createElement } from 'preact';
import propTypes from 'prop-types';
import i18nService from '../../services/i18nService';

import { useShortcut } from '../../shared/shortcut';
import SvgIcon from '../../shared/components/svg-icon';

/**
 * @param {Object} props
 *  @param {number} [props.badgeCount]
 *  @param {string} [props.icon]
 *  @param {string} props.label
 *  @param {() => any} props.onClick
 *  @param {string|null} props.shortcut
 */
function ToolbarButton({ badgeCount, icon, label, onClick, shortcut }) {
  useShortcut(shortcut, onClick);

  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      className="annotator-adder-actions__button"
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      {icon && (
        <SvgIcon name={icon} className="annotator-adder-actions__icon" />
      )}
      {typeof badgeCount === 'number' && (
        <span className="annotator-adder-actions__badge">{badgeCount}</span>
      )}
      <span className="annotator-adder-actions__label">{label}</span>
    </button>
  );
}

ToolbarButton.propTypes = {
  badgeCount: propTypes.number,
  icon: propTypes.string,
  label: propTypes.string.isRequired,
  onClick: propTypes.func.isRequired,
  shortcut: propTypes.string,
};

/**
 * Union of possible toolbar commands.
 *
 * @typedef {'annotate'|'highlight'|'show'} Command
 */

/**
 * @typedef AdderToolbarProps
 * @prop {'up'|'down'} arrowDirection -
 *   Whether the arrow pointing out of the toolbar towards the selected text
 *   should appear above the toolbar pointing Up or below the toolbar pointing
 *   Down.
 * @prop {boolean} isVisible - Whether to show the toolbar or not.
 * @prop {(c: Command) => any} onCommand - Called when a toolbar button is clicked.
 * @prop {number} [annotationCount] -
 *   Number of annotations associated with the selected text.
 *   If non-zero, a "Show" button is displayed to allow the user to see the
 *   annotations that correspond to the selection.
 * @prop {boolean} disableShowButton - whether to hide the show button
 */

/**
 * The toolbar that is displayed above selected text in the document providing
 * options to create annotations or highlights.
 *
 * @param {AdderToolbarProps} props
 */
export default function AdderToolbar({
  arrowDirection,
  isVisible,
  onCommand,
  annotationCount = 0,
  disableShowButton = false,
}) {
  i18nService.initI18n()
  const handleCommand = (event, command) => {
    event.preventDefault();
    event.stopPropagation();

    onCommand(command);
  };

  // Since the selection toolbar is only shown when there is a selection
  // of static text, we can use a plain key without any modifier as
  // the shortcut. This avoids conflicts with browser/OS shortcuts.
  const annotateShortcut = isVisible ? 'a' : null;
  const highlightShortcut = isVisible ? 'h' : null;
  const showShortcut = isVisible ? 's' : null;

  // nb. The adder is hidden using the `visibility` property rather than `display`
  // so that we can compute its size in order to position it before display.
  return (
    // @ts-ignore - TS doesn't know about our custom element types.
    <hypothesis-adder-toolbar
      class={classnames('annotator-adder', {
        'annotator-adder--arrow-down': arrowDirection === 'down',
        'annotator-adder--arrow-up': arrowDirection === 'up',
        'is-active': isVisible,
      })}
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      {/* @ts-ignore */}
      <hypothesis-adder-actions className="annotator-adder-actions">
        <ToolbarButton
          icon="annotate"
          onClick={e => handleCommand(e, 'annotate')}
          label={i18nService.tl('sidebar.buttons.annotate')}
          shortcut={annotateShortcut}
        />
        <ToolbarButton
          icon="highlight"
          onClick={e => handleCommand(e, 'highlight')}
          label="Highlight"
          shortcut={highlightShortcut}
        />
        {annotationCount > 0 && !disableShowButton && (
          <div className="annotator-adder-actions__separator" />
        )}
        {annotationCount > 0 && !disableShowButton && (
          <ToolbarButton
            badgeCount={annotationCount}
            onClick={e => handleCommand(e, 'show')}
            label="Show"
            shortcut={showShortcut}
          />
        )}
        {/* @ts-ignore */}
      </hypothesis-adder-actions>
      {/* @ts-ignore */}
    </hypothesis-adder-toolbar>
  );
}

AdderToolbar.propTypes = {
  arrowDirection: propTypes.oneOf(['up', 'down']).isRequired,
  isVisible: propTypes.bool.isRequired,
  onCommand: propTypes.func.isRequired,
  annotationCount: propTypes.number,
  disableShowButton: propTypes.boolean,
};
