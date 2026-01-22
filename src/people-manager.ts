// ABOUTME: Service for managing person profiles and coaching plans
// ABOUTME: Handles CRUD operations for people data stored in vault
import {App, TFile, TFolder} from 'obsidian';
import {PersonProfile, CoachingPlan, FocusArea, GrowthExperiment, FeedbackItem} from './types';
import {OneOnOneSettings} from './settings';

export class PeopleManager {
	constructor(private app: App, private settings: OneOnOneSettings) {}

	async getAllPeople(): Promise<PersonProfile[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.settings.peopleProfilesFolder);
		if (!folder) return [];

		const profiles: PersonProfile[] = [];
		const files = this.app.vault.getMarkdownFiles()
			.filter(f => f.path.startsWith(this.settings.peopleProfilesFolder));

		for (const file of files) {
			const profile = await this.loadPersonProfile(file);
			if (profile) profiles.push(profile);
		}

		return profiles.sort((a, b) => a.name.localeCompare(b.name));
	}

	async loadPersonProfile(file: TFile): Promise<PersonProfile | null> {
		try {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache?.frontmatter) return null;

			const fm = cache.frontmatter;
			return {
				name: fm.name || file.basename,
				role: fm.role,
				level: fm.level,
				team: fm.team,
				reportsTo: fm.reportsTo,
				startDate: fm.startDate,
				email: fm.email,
				slackHandle: fm.slackHandle,
				notes: fm.notes
			};
		} catch (error) {
			console.error('Error loading person profile:', error);
			return null;
		}
	}

	async savePersonProfile(profile: PersonProfile): Promise<void> {
		const folder = this.settings.peopleProfilesFolder;
		const fileName = `${profile.name.replace(/\s+/g, '-')}.md`;
		const filePath = `${folder}/${fileName}`;

		const content = this.generateProfileContent(profile);

		try {
			const folderExists = this.app.vault.getAbstractFileByPath(folder);
			if (!folderExists) {
				await this.app.vault.createFolder(folder);
			}

			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile instanceof TFile) {
				await this.app.vault.modify(existingFile, content);
			} else {
				await this.app.vault.create(filePath, content);
			}
		} catch (error) {
			console.error('Error saving person profile:', error);
			throw error;
		}
	}

	private generateProfileContent(profile: PersonProfile): string {
		let content = '---\n';
		content += `name: ${profile.name}\n`;
		if (profile.role) content += `role: ${profile.role}\n`;
		if (profile.level) content += `level: ${profile.level}\n`;
		if (profile.team) content += `team: ${profile.team}\n`;
		if (profile.reportsTo) content += `reportsTo: ${profile.reportsTo}\n`;
		if (profile.startDate) content += `startDate: ${profile.startDate}\n`;
		if (profile.email) content += `email: ${profile.email}\n`;
		if (profile.slackHandle) content += `slackHandle: ${profile.slackHandle}\n`;
		content += '---\n\n';
		content += `# ${profile.name}\n\n`;
		if (profile.notes) {
			content += `## Notes\n\n${profile.notes}\n\n`;
		}
		return content;
	}

	async deletePersonProfile(name: string): Promise<void> {
		const folder = this.settings.peopleProfilesFolder;
		const fileName = `${name.replace(/\s+/g, '-')}.md`;
		const filePath = `${folder}/${fileName}`;

		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await this.app.vault.delete(file);
		}
	}

	async getCoachingPlan(person: string): Promise<CoachingPlan | null> {
		const folder = this.settings.coachingPlansFolder;
		const fileName = `${person.replace(/\s+/g, '-')}-coaching-plan.md`;
		const filePath = `${folder}/${fileName}`;

		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) return null;

		try {
			const content = await this.app.vault.read(file);
			return this.parseCoachingPlan(content, person);
		} catch (error) {
			console.error('Error loading coaching plan:', error);
			return null;
		}
	}

	private parseCoachingPlan(content: string, person: string): CoachingPlan {
		const cache = this.app.metadataCache.getCache(content);
		const fm = cache?.frontmatter || {};

		return {
			person,
			role: fm.role,
			level: fm.level,
			targetLevel: fm.targetLevel,
			startDate: fm.startDate,
			focusAreas: fm.focusAreas || [],
			growthExperiments: fm.growthExperiments || [],
			feedbackToDeliver: fm.feedbackToDeliver || [],
			discussionPatterns: new Map(Object.entries(fm.discussionPatterns || {})),
			concerns: fm.concerns || [],
			lastReviewDate: fm.lastReviewDate,
			nextReviewDate: fm.nextReviewDate
		};
	}

	async saveCoachingPlan(plan: CoachingPlan): Promise<void> {
		const folder = this.settings.coachingPlansFolder;
		const fileName = `${plan.person.replace(/\s+/g, '-')}-coaching-plan.md`;
		const filePath = `${folder}/${fileName}`;

		const content = this.generateCoachingPlanContent(plan);

		try {
			const folderExists = this.app.vault.getAbstractFileByPath(folder);
			if (!folderExists) {
				await this.app.vault.createFolder(folder);
			}

			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile instanceof TFile) {
				await this.app.vault.modify(existingFile, content);
			} else {
				await this.app.vault.create(filePath, content);
			}
		} catch (error) {
			console.error('Error saving coaching plan:', error);
			throw error;
		}
	}

	private generateCoachingPlanContent(plan: CoachingPlan): string {
		const today = new Date().toISOString().split('T')[0];
		
		let content = '---\n';
		content += `person: ${plan.person}\n`;
		if (plan.role) content += `role: ${plan.role}\n`;
		if (plan.level) content += `level: ${plan.level}\n`;
		if (plan.targetLevel) content += `targetLevel: ${plan.targetLevel}\n`;
		if (plan.startDate) content += `startDate: ${plan.startDate}\n`;
		if (plan.lastReviewDate) content += `lastReviewDate: ${plan.lastReviewDate}\n`;
		if (plan.nextReviewDate) content += `nextReviewDate: ${plan.nextReviewDate}\n`;
		content += '---\n\n';
		
		content += `# Coaching Plan: ${plan.person}\n\n`;
		
		if (plan.role) {
			content += `**Role:** ${plan.role}\n`;
		}
		if (plan.level && plan.targetLevel) {
			content += `**Level:** ${plan.level} → ${plan.targetLevel} (goal)\n`;
		} else if (plan.level) {
			content += `**Level:** ${plan.level}\n`;
		}
		if (plan.startDate) {
			content += `**Start Date:** ${plan.startDate}\n`;
		}
		content += '\n';

		content += '## Current Focus Areas\n\n';
		if (plan.focusAreas.length > 0) {
			for (const area of plan.focusAreas) {
				content += `### ${area.title}\n`;
				content += `**Priority:** ${area.priority} | **Status:** ${area.status}\n\n`;
				content += `${area.description}\n\n`;
			}
		} else {
			content += 'No focus areas defined yet.\n\n';
		}

		content += '## Growth Experiments\n\n';
		if (plan.growthExperiments.length > 0) {
			for (const exp of plan.growthExperiments) {
				const checkbox = exp.status === 'completed' ? '[x]' : '[ ]';
				content += `- ${checkbox} **${exp.title}** (${exp.status})\n`;
				content += `  - ${exp.description}\n`;
				if (exp.outcome) content += `  - Outcome: ${exp.outcome}\n`;
			}
		} else {
			content += 'No growth experiments yet.\n';
		}
		content += '\n';

		content += '## Feedback to Deliver\n\n';
		if (plan.feedbackToDeliver.length > 0) {
			for (const item of plan.feedbackToDeliver) {
				const checkbox = item.delivered ? '[x]' : '[ ]';
				const date = item.dateDelivered ? ` (delivered ${item.dateDelivered})` : '';
				content += `- ${checkbox} ${item.feedback}${date}\n`;
			}
		} else {
			content += 'No pending feedback.\n';
		}
		content += '\n';

		if (plan.discussionPatterns.size > 0) {
			content += '## Discussion Patterns\n\n';
			const sorted = Array.from(plan.discussionPatterns.entries())
				.sort((a, b) => b[1] - a[1]);
			for (const [topic, count] of sorted) {
				content += `- ${topic}: ${count} times\n`;
			}
			content += '\n';
		}

		if (plan.concerns.length > 0) {
			content += '## Concerns & Risks\n\n';
			for (const concern of plan.concerns) {
				content += `- ${concern}\n`;
			}
			content += '\n';
		}

		content += '---\n\n';
		if (plan.lastReviewDate) {
			content += `**Last Review:** ${plan.lastReviewDate}\n`;
		}
		if (plan.nextReviewDate) {
			content += `**Next Review:** ${plan.nextReviewDate}\n`;
		}

		return content;
	}
}
