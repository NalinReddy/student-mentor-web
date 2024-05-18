import { TopicLookup } from "app/core/tasks/topicsapi.service";
import { Task } from "./task.model";

export class Topic extends Task {
    id: string;
    topic: string | TopicLookup;
    task: Task | string;
    discussion: string;
    reply: string;
    order: number;
    postedDate: any;
    postedBy: any;
    count: number; // for reports allocation
}

export const DiscussionReplies = [
    "0/2", "1/2", "2/2", "1/3", "2/3", "3/3", "0/1", "1/1", "0/3", "0/4", "1/4", "2/4", "3/4", "4/4"
];

export const RepliesStatus = [
    "Done", "Pending"
];