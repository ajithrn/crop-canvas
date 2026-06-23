/**
 * CropCanvas — Entry Point
 * Imports all CSS modules and initializes the app.
 */

// CSS (order matters)
import './css/tokens.css';
import './css/base.css';
import './css/topbar.css';
import './css/toolbar.css';
import './css/workspace.css';
import './css/dropzone.css';
import './css/panel.css';
import './css/properties.css';
import './css/layers.css';
import './css/export.css';
import './css/elements.css';
import './css/colorpicker.css';
import './css/help.css';
import './css/utilities.css';

// App
import { init } from './js/app.js';

document.addEventListener('DOMContentLoaded', init);
