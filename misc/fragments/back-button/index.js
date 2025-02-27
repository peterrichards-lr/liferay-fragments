/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

if (layoutMode == 'view') {
	const link = fragmentElement.querySelector(`#fragment-${fragmentEntryLinkNamespace}-link`);
	link.addEventListener('click', () => history.back());
}