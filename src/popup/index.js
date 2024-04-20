/*
 * Copyright (C) 2023 Elijah Olmos
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { reconstruct } from '../stores';
import Popup from './Popup.svelte';
import './style.css';

try {
	// NEEDS to be called for stores to be shared between background & popup
	await reconstruct();
} catch (e) {
	console.error('fatal error reconstructing stores', e);
}

export default new Popup({ target: document.body });
