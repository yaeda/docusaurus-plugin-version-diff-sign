import type {ComponentProps} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import VersionDiffSign from '@version-diff-sign-renderer-heading';
import {
  getSignTargetOptions,
  getVersionDiffClassName,
  isConfiguredHeadingLevel,
  toVisibleState,
  useCurrentDocDiff,
  useVersionDiffPluginData,
} from '../../runtime/pluginData.js';

type HeadingProps = ComponentProps<typeof Heading>;

function toHeadingLevel(as?: HeadingProps['as']): number | null {
  if (!as || !/^h[1-6]$/u.test(as)) {
    return null;
  }

  return Number.parseInt(as.slice(1), 10);
}

export default function MDXHeading(props: HeadingProps) {
  const currentDoc = useCurrentDocDiff();
  const pluginData = useVersionDiffPluginData();
  const headingLevel = toHeadingLevel(props.as);
  const headingSignOptions = getSignTargetOptions(pluginData.options, 'heading');

  if (
    !currentDoc ||
    !pluginData.options.targets.headings ||
    !headingLevel ||
    !isConfiguredHeadingLevel(pluginData.options, headingLevel)
  ) {
    return <Heading {...props} />;
  }

  const headingState =
    headingLevel === 1
      ? toVisibleState(props.id ? currentDoc.headings[props.id]?.state : undefined) ??
        toVisibleState(currentDoc.titleState)
      : toVisibleState(props.id ? currentDoc.headings[props.id]?.state : undefined);

  if (!headingState) {
    return <Heading {...props} />;
  }

  return (
    <Heading
      {...props}
      className={clsx(
        props.className,
        getVersionDiffClassName('heading', headingState, headingSignOptions.type),
      )}>
      <span className="version-diff-sign__content">
        {props.children}
        <VersionDiffSign
          state={headingState}
          target="heading"
          type={headingSignOptions.type}
          color={headingSignOptions.color}
          docId={currentDoc.unversionedId}
          headingId={props.id}
          headingLevel={headingLevel}
          className="version-diff-sign__inline"
        />
      </span>
    </Heading>
  );
}
