import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $setSelection,
  type LexicalNode,
} from 'lexical'

export function insertDecoratorWithTrailingParagraph(createNode: () => LexicalNode): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    $setSelection($getRoot().selectEnd())
  }
  $insertNodes([createNode(), $createParagraphNode()])
}

export function removeDecoratorNode(
  nodeKey: string,
  isTargetNode: (node: LexicalNode) => boolean
): void {
  const node = $getNodeByKey(nodeKey)
  if (node && isTargetNode(node)) {
    node.remove()
  }
}
