"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express = __importStar(require("express"));
const help_1 = __importDefault(require("./help"));
const streamer_1 = __importDefault(require("./streamer"));
const twitch_1 = __importDefault(require("./twitch"));
const endpoint = 'index';
const type = 'app';
const router = express.Router();
// Help
router.get('/help', help_1.default);
// Streamer
router.get('/streamer', streamer_1.default);
// Twitch
router.get('/twitch', twitch_1.default);
// index
router.get('/', (request, response) => {
    response.render(endpoint, {
        title: 'Social Adventure'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map