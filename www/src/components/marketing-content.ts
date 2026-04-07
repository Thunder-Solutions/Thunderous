import { html, css, customElement } from 'thunderous';
import { theme } from '../styles/theme';

export const MarketingContent = customElement(
	({ adoptStyleSheet, connectedCallback, elementRef, refs, attrSignals }) => {
		const [_standalone] = attrSignals['standalone'];
		const standalone = _standalone() !== null;
		adoptStyleSheet(theme);
		adoptStyleSheet(styles);
		connectedCallback(() => {
			const isNested = elementRef.parentElement?.closest('th-marketing-content') !== null;
			if (isNested && refs['marketing-content'] !== null) {
				refs['marketing-content'].classList.add('nested');
			}
		});
		return html`
			<div ref="marketing-content" class="marketing-content ${standalone ? 'standalone' : ''}">
				<slot></slot>
			</div>
		`;
	},
);

const styles = css`
	.marketing-content {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: center;
		gap: 1em;
		max-width: 50em;
		margin: 0 auto;
	}
	.marketing-content:not(.nested) {
		max-width: 100em;
		padding: 0 2em;
	}
	@media (min-width: 60em) {
		.marketing-content:not(.nested) {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 2em;
			padding: 0 4em;
		}

		.marketing-content:not(.nested).standalone {
			grid-template-columns: minmax(0, 1fr);
		}
	}
`;
