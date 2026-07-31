// ABOUTME: Confirmation dialog used in place of the native window.confirm
// ABOUTME: window.confirm is blocked by Obsidian's plugin guidelines and doesn't work on mobile
import {App, Modal} from 'obsidian';

interface ConfirmModalOptions {
	title?: string;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
}

export class ConfirmModal extends Modal {
	private message: string;
	private onConfirm: () => void | Promise<void>;
	private options: ConfirmModalOptions;

	constructor(app: App, message: string, onConfirm: () => void | Promise<void>, options: ConfirmModalOptions = {}) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
		this.options = options;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.addClass('one-on-one-modal');

		contentEl.createEl('h2', {text: this.options.title ?? 'Confirm'});
		contentEl.createEl('p', {text: this.message});

		const buttonRow = contentEl.createEl('div', {cls: 'form-buttons'});

		const confirmBtn = buttonRow.createEl('button', {
			text: this.options.confirmText ?? 'Confirm',
			cls: this.options.isDestructive ? 'mod-warning' : 'mod-cta'
		});
		confirmBtn.addEventListener('click', () => {
			this.close();
			void this.onConfirm();
		});

		const cancelBtn = buttonRow.createEl('button', {text: this.options.cancelText ?? 'Cancel'});
		cancelBtn.addEventListener('click', () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
