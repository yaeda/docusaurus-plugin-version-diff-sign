import type {CSSProperties} from 'react';
import clsx from 'clsx';
import {
  getVersionDiffClassName,
  useVersionDiffPluginData,
} from '../../runtime/pluginData.js';
import type {VersionDiffRendererProps} from '../../types.js';

function getLabel(state: VersionDiffRendererProps['state']): string {
  if (state === 'new') {
    return 'NEW';
  }

  if (state === 'updated') {
    return 'UPDATED';
  }

  return '';
}

export default function VersionDiffSign({
  state,
  target,
  type,
  color,
  className,
}: VersionDiffRendererProps) {
  useVersionDiffPluginData();
  const signClassName = getVersionDiffClassName(target, state, type, className);
  const style = color
    ? ({'--version-diff-sign-color': color} as CSSProperties)
    : undefined;

  if (type === 'dot') {
    return <span className={signClassName} style={style} />;
  }

  return (
    <span className={signClassName} style={style}>
      {getLabel(state)}
    </span>
  );
}
