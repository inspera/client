import classnames from 'classnames';
import { createElement } from 'preact';
import { useRef } from 'preact/hooks';
import propTypes from 'prop-types';

import { useShortcut } from '../../shared/shortcut';
import SvgIcon from '../../shared/components/svg-icon';

/**
 * @param {Object} props
 *  @param {string} [props.id]
 *  @param {number} [props.badgeCount]
 *  @param {string} [props.icon]
 *  @param {string} props.label
 *  @param {() => any} props.onClick
 *  @param {string|null} props.shortcut
 *  @param {boolean} [props.isFocused]
 */
function ToolbarButton({
  id,
  badgeCount,
  icon,
  label,
  onClick,
  shortcut,
  // isFocused, // disabled until IA1-5318 will be fixed
}) {
  const adderButtonRef = useRef(/** @type {HTMLButtonElement|null} */ (null));
  const title = shortcut ? `${label} (${shortcut})` : label;

  useShortcut(shortcut, onClick);

  // useEffect(() => { // disabled until IA1-5318 will be fixed
  //   if (isFocused) {
  //     adderButtonRef.current.focus();
  //   }
  // }, [isFocused]);

  return (
    <button
      id={id}
      className="annotator-adder-actions__button"
      onClick={onClick}
      aria-label={title}
      title={title}
      tabIndex={0}
      ref={adderButtonRef}
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
  id: propTypes.string,
  badgeCount: propTypes.number,
  icon: propTypes.string,
  label: propTypes.string.isRequired,
  onClick: propTypes.func.isRequired,
  shortcut: propTypes.string,
  isFocused: propTypes.boolean,
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
 * @prop {array} tools - List of buttons
 */

/**
 * The toolbar that is displayed above selected text in the document providing
 * options to create annotations or highlights.
 *
 * @param {AdderToolbarProps} props
 */
export default function AdderToolbar({ arrowDirection, isVisible, tools }) {
  const handleCommand = (event, command) => {
    event.preventDefault();
    event.stopPropagation();
    command();
  };

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
        {tools.map(tool => (
          <ToolbarButton
            key={tool.name}
            id={`${tool.name}-adder-button`}
            icon={tool.icon || tool.name}
            onClick={e => handleCommand(e, tool.command)}
            label={tool.caption}
            shortcut={tool.shortcut}
            isFocused={isVisible}
          />
        ))}
        {/* @ts-ignore */}
      </hypothesis-adder-actions>
      {/* @ts-ignore */}
    </hypothesis-adder-toolbar>
  );
}

AdderToolbar.propTypes = {
  arrowDirection: propTypes.oneOf(['up', 'down']).isRequired,
  isVisible: propTypes.bool.isRequired,
  tools: propTypes.array.isRequired,
};
