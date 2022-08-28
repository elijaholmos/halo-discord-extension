import { reconstruct } from '../stores';
import Popup from './Popup.svelte';
import './style.css';

console.log('pre-wait');
const stores = await reconstruct();
console.log('post-wait');
console.log(stores);

export default new Popup({ target: document.body });
