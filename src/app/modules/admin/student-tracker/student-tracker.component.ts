import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Student } from 'app/models/student.model';
import { MatTableModule } from '@angular/material/table';
import { StudentApiService } from 'app/core/student/studentapi.Service';
import { cloneDeep } from 'lodash';
import { TasksApiService } from 'app/core/tasks/tasksapi.Service';
import { Task, TaskStatus } from 'app/models/task.model';
import { Subscription } from 'rxjs';
import { Topic } from 'app/models/topic.model';
import { TopicLookup } from 'app/core/tasks/topicsapi.service';

@Component({
  selector: 'app-student-tracker',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatTableModule],
  templateUrl: './student-tracker.component.html',
  styleUrls: ['./student-tracker.component.scss'],
  providers: [TasksApiService]
})
export class StudentTrackerComponent {

  columns = [
    "name", "eduEmail", "eduPassword", "university", "course", "term", "collegeTerm", "active", "select"
  ];

  students = [];
  tasks: Task[] = [];
  allocationMap = new Map<any, any>();
  weeksArr: any[];
  private primarySubscripton: Subscription = new Subscription();
  taskStatusArr = Object.keys(TaskStatus).map(key => ({id: key, name: TaskStatus[key]}));
  weeks: any[];
  selectedStudent: any;
  query = {week: 'all', status: 'all'}
  filterActive: boolean;
  selectedstudentCourseDetails: Task;
  latestGrade: string;

  /**
   *
   */
  constructor(private studentApiService: StudentApiService, private tasksApiService: TasksApiService) {
    this.primarySubscripton.add(
      this.tasksApiService.tasksForReport.subscribe(d => {
        this.tasks = d;
        if (this.tasks?.length) {
          this.selectedstudentCourseDetails = this.tasks[0];
        }
        this.groupByWeek(this.tasks);
      })
    );
    
  }

  ngOnDestroy(): void {
    this.tasksApiService.resetTasks();
    this.primarySubscripton.unsubscribe();
  }

  filterByQuery(searchText: string) {
    console.log(searchText);
    this.students = []; // Clear the students array before performing a new search
    this.studentApiService.searchStudent(searchText).subscribe(d => {
      const students = [];
      d.forEach(stundent => {
        stundent.courses.forEach(course => {
          students.push({...stundent, course: course.course, assignedMentors: course.assignedMentors});
        });
      });
      this.students = cloneDeep(students);
      console.log(this.students);
    });
  }

  filterBasedOnTaskStatus(event: MatSelectChange) {
    console.log(event);
    this.query.status = event.value;
    this.filterActive = true;
    this.selectedstudentCourseDetails = this.tasks[0];
    console.log(this.query);

    this.tasksApiService.getAllTasksForStudentTracker(this.selectedStudent.university?.id, this.selectedStudent.course.id, this.selectedStudent.course.term.id, this.selectedStudent.id, this.query);
  }

  filterBasedOnWeek(event: MatSelectChange) {
    this.query.week = event.value;
    this.selectedstudentCourseDetails = this.tasks[0];
    this.filterActive = true;
    this.tasksApiService.getAllTasksForStudentTracker(this.selectedStudent.university?.id, this.selectedStudent.course.id, this.selectedStudent.course.term.id, this.selectedStudent.id, this.query);
  }

  getAllTasksForStudentTracker(student) {
    this.selectedStudent = student;
    console.log(this.selectedStudent);
    this.query = {week: 'all', status: 'all'};
    this.filterActive = false;
    this.weeks = Array.from({ length: student.course.termPeriod.endWeek - student.course.termPeriod.startWeek + 1 }, (_, index) => student.course.termPeriod.startWeek + index);
    this.tasksApiService.getAllTasksForStudentTracker(student.university?.id, student.course.id, student.course.term.id, student.id);
  }

  groupByWeek(tasks: Task[]) {
    this.allocationMap.clear();

    tasks.forEach(task => {
        const discussions = task.discussions?.length ? JSON.parse(task.discussions as string) || {} : {};
        const repliesStatus = task.repliesStatus?.length ? JSON.parse(task.repliesStatus as string) || {} : {};

        if (!task.topics?.length) return; // If no topics, skip

        // Map discussionReplies and replyStatus to discussions
        const discussionTopicsIndexes: number[] = (task.topics as Topic[])
        .map((topic: Topic, i: number) => ({ name: (topic.topic as TopicLookup).name, categoryName: ((topic.topic as TopicLookup).category as any)?.name, index: i }))
        .filter((topic: { name: string, categoryName: string, index: number }) => {
            // Use a regular expression to match topic lookup category name with "Discussion"
            return /^discussion/.test(topic.categoryName?.toLowerCase());
        })
        .map((filteredTopic: { name: string, index: number }) => filteredTopic.index);
    
        console.log(discussionTopicsIndexes);
        Object.keys(discussions).forEach((key, i) => {
          (task.topics[discussionTopicsIndexes[i]] as Topic).discussions = discussions[key];
        });
        Object.keys(repliesStatus).forEach((key, i) => {
          (task.topics[discussionTopicsIndexes[i]] as Topic).repliesStatus = repliesStatus[key];
        });

        const topics = cloneDeep(task.topics).map((topic, i) => {
            topic.course = task.course;
            return topic;
        });

        const week = task.week;
        if (this.allocationMap.has(week)) {
            const existingTopics = this.allocationMap.get(week);
            this.allocationMap.set(week, [...existingTopics, ...topics]);
        } else {
            if (task.grade) {
              this.latestGrade = task.grade;
            }
            this.allocationMap.set(week, topics);
        }
    });

    console.log(this.allocationMap);
    this.weeksArr = Array.from(this.allocationMap.keys());
}

  getAllTopicsByWeek(week: string) {
    return this.allocationMap.get(+week);
  }

}
