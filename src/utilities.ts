export const NOOP = () => void 0;

export const queryComment = (node: Node, comment: string) => {
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT, {
		acceptNode: (n) => (n.nodeValue === comment ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
	});
	return walker.nextNode() as Comment | null;
};
