import { css, customElement, html } from 'thunderous';

// Table container component
export const Table = customElement(({ adoptStyleSheet, internals }) => {
	internals.role = 'table';
	adoptStyleSheet(tableStyles);
	return html`<slot></slot>`;
});

const tableStyles = css`
	:host {
		display: grid;
		grid-template-columns: repeat(var(--table-cols, 3), 1fr);
		width: 100%;
		margin: 1em 0;
		font-size: 0.95em;
		border-radius: 0.5em;
		overflow: hidden;
	}
`;

// Table row component
export const TableRow = customElement(({ adoptStyleSheet, internals }) => {
	internals.role = 'row';
	adoptStyleSheet(rowStyles);
	return html`<slot></slot>`;
});

const rowStyles = css`
	:host {
		display: contents;
	}
`;

// Table header cell component
export const TableHeader = customElement(({ adoptStyleSheet, internals }) => {
	internals.role = 'columnheader';
	adoptStyleSheet(headerStyles);
	return html`<slot></slot>`;
});

const headerStyles = css`
	:host {
		background-color: var(--table-header-bg, #645966);
		color: var(--table-header-color, #fff);
		font-weight: 600;
		padding: var(--table-padding, 0.75em 1em);
		text-align: left;
	}
`;

// Table data cell component
export const TableCell = customElement(({ adoptStyleSheet, internals }) => {
	internals.role = 'cell';
	adoptStyleSheet(cellStyles);
	return html`<slot></slot>`;
});

const cellStyles = css`
	:host {
		background-color: var(--table-cell-bg, #111);
		padding: var(--table-padding, 0.75em 1em);
		text-align: left;
		border-bottom: 1px solid var(--table-border-color, #645966);
	}

	:host-context(th-tr:last-child) {
		border-bottom: none;
	}
`;

// Table body component (optional wrapper)
export const TableBody = customElement(({ adoptStyleSheet, internals }) => {
	internals.role = 'rowgroup';
	adoptStyleSheet(bodyStyles);
	return html`<slot></slot>`;
});

const bodyStyles = css`
	:host {
		display: contents;
	}
`;

// Table header section component (optional wrapper)
export const TableHeaderSection = customElement(({ adoptStyleSheet, internals }) => {
	internals.role = 'rowgroup';
	adoptStyleSheet(headerSectionStyles);
	return html`<slot></slot>`;
});

const headerSectionStyles = css`
	:host {
		display: contents;
	}
`;
