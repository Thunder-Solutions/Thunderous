import { BlockQuote } from './_components/block-quote';
import { Code, CodeBlock } from './_components/code';
import { ContentGroup } from './_components/content-group';
import { DocPage } from './_components/doc-page';
import { ErrorMessage } from './_components/error-message';
import { Footer } from './_components/footer';
import { ContentHeader, PageHeader } from './_components/header';
import { Icon } from './_components/icon';
import { InvisibleLink, Link, LinkButton } from './_components/link';
import { Page } from './_components/page';
import { Splash } from './_components/splash';
import { Text } from './_components/text';

Page.define('th-page');
DocPage.define('th-doc-page');
Splash.define('th-splash');
Link.define('th-link');
InvisibleLink.define('th-invisible-link');
LinkButton.define('th-link-button');
PageHeader.define('th-page-header');
ContentHeader.define('th-content-header');
Text.define('th-text');
ContentGroup.define('th-content-group');
Code.define('th-code');
CodeBlock.define('th-code-block');
BlockQuote.define('th-block-quote');
Icon.define('th-icon');
Footer.define('th-footer');
ErrorMessage.define('th-error-message');

// correct the path since static HTML is served from the root of each directory
if (!location.pathname.endsWith('/')) {
	location.pathname = location.pathname + '/';
} else if (location.pathname.length > 1 && location.pathname !== '/404/') {
	const isHome = document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value === 'home';
	if (isHome) location.pathname = '/404/';
}
