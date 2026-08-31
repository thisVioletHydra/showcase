import consistentBlockIndent from './rules/consistent-block-indent.mjs';
import consistentCallArguments from './rules/consistent-call-arguments.mjs';
import consistentChainLayout from './rules/consistent-chain-layout.mjs';
import consistentConditionSpacing from './rules/consistent-condition-spacing.mjs';
import consistentObjectLayout from './rules/consistent-object-layout.mjs';
import consistentParameterLayout from './rules/consistent-parameter-layout.mjs';
import consistentPropertyIndent from './rules/consistent-property-indent.mjs';
import consistentTernaryLayout from './rules/consistent-ternary-layout.mjs';
import idLength from './rules/id-length.mjs';
import importLayout from './rules/import-layout.mjs';
import noBangCondition from './rules/no-bang-condition.mjs';
import noBlankLinesInArrowExpression from './rules/no-blank-lines-in-arrow-expression.mjs';
import noBlankLinesInChain from './rules/no-blank-lines-in-chain.mjs';
import noFloatingPromise from './rules/no-floating-promise.mjs';
import noNodeNamedImport from './rules/no-node-named-import.mjs';
import paddingLineBeforeDecorator from './rules/padding-line-before-decorator.mjs';
import preferFsPromises from './rules/prefer-fs-promises.mjs';
import preferNodeDefaultName from './rules/prefer-node-default-name.mjs';
import preferObjectArrowMethod from './rules/prefer-object-arrow-method.mjs';
import preferProcessImport from './rules/prefer-process-import.mjs';

export default {
  meta: {
    name: 'selfskills',
  },
  rules: {
    'consistent-block-indent': consistentBlockIndent,
    'consistent-call-arguments': consistentCallArguments,
    'consistent-chain-layout': consistentChainLayout,
    'consistent-condition-spacing': consistentConditionSpacing,
    'consistent-object-layout': consistentObjectLayout,
    'consistent-parameter-layout': consistentParameterLayout,
    'consistent-property-indent': consistentPropertyIndent,
    'consistent-ternary-layout': consistentTernaryLayout,
    'id-length': idLength,
    'import-layout': importLayout,
    'no-bang-condition': noBangCondition,
    'no-blank-lines-in-arrow-expression': noBlankLinesInArrowExpression,
    'no-blank-lines-in-chain': noBlankLinesInChain,
    'no-floating-promise': noFloatingPromise,
    'no-node-named-import': noNodeNamedImport,
    'padding-line-before-decorator': paddingLineBeforeDecorator,
    'prefer-fs-promises': preferFsPromises,
    'prefer-node-default-name': preferNodeDefaultName,
    'prefer-object-arrow-method': preferObjectArrowMethod,
    'prefer-process-import': preferProcessImport,
  },
};
