import { css } from "thunderous";

export const theme = css`
	:host {
		--color-page-1: #0f172a;
		--color-page-1-1: #111827;
		--color-page-1-2: #0b1120;
		--color-page-1-c: #eaf2ff;
		--color-accent-1: rgba(99, 102, 241, 0.22);
		--color-accent-1-1: rgba(14, 165, 233, 0.18);

		--color-surface-1: rgba(255, 255, 255, 0.06);
		--color-surface-1-1: rgba(255, 255, 255, 0.03);
		--color-surface-1-2: rgba(255, 255, 255, 0.1);
		--color-neutral-1: #e5eefc;
		--color-neutral-1-1: #9fb0d1;
		--color-brand-1: #8fb4ff;
		--color-brand-1-1: #2a4692;
		--shadow-1: 0 10px 30px rgba(0, 0, 0, 0.18);

		--color-surface-2: rgba(255, 255, 255, 0.72);
		--color-surface-2-1: rgba(255, 255, 255, 0.5);
		--color-surface-2-2: rgba(255, 255, 255, 0.35);
		--color-neutral-2: #1e293b;
		--color-neutral-2-1: #b8c7e6;
		--color-brand-2: #7dd3fc;
		--color-brand-2-1: #c4b5fd;
		--shadow-2: 0 18px 50px rgba(15, 23, 42, 0.35);

		@media (prefers-color-scheme: light) {
			--color-page-1: #f0f4fa;
			--color-page-1-1: #e8edf5;
			--color-page-1-2: #f5f7fb;
			--color-page-1-c: #1e293b;
			--color-accent-1: rgba(99, 102, 241, 0.1);
			--color-accent-1-1: rgba(14, 165, 233, 0.08);

			--color-surface-1: rgba(255, 255, 255, 0.7);
			--color-surface-1-1: rgba(255, 255, 255, 0.5);
			--color-surface-1-2: rgba(99, 102, 241, 0.16);
			--color-neutral-1: #1e293b;
			--color-neutral-1-1: #475569;
			--color-brand-1: #2563eb;
			--color-brand-1-1: #7c3aed;
			--shadow-1: 0 10px 30px rgba(51, 65, 85, 0.1);

			--color-surface-2: rgba(255, 255, 255, 0.92);
			--color-surface-2-1: rgba(245, 248, 255, 0.85);
			--color-surface-2-2: rgba(99, 102, 241, 0.18);
			--color-neutral-2: #1e293b;
			--color-neutral-2-1: #475569;
			--color-brand-2: #4f46e5;
			--color-brand-2-1: #7c3aed;
			--shadow-2: 0 18px 40px rgba(51, 65, 85, 0.12);
		}
	}
`;
