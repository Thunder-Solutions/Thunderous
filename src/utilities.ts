export const NOOP = () => void 0;

export const queryComment = (node: Node, comment: string) => {
	for (const child of node.childNodes) {
		if (child.nodeType === Node.COMMENT_NODE && child.nodeValue === comment) {
			return child;
		}
	}
	return null;
};
