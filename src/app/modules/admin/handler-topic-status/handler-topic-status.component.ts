import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { TopicLookup, TopicsApiService } from 'app/core/tasks/topicsapi.service';
import { UniversityApiService } from 'app/core/university/universityapi.service';
import { University } from 'app/models/university.model';
import { SelectErrorStateMatcher } from '@fuse/directives/error-state-matcher';

@Component({
  selector: 'app-handler-topic-status',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatTableModule],
  templateUrl: './handler-topic-status.component.html',
  styleUrls: ['./handler-topic-status.component.scss'],
  providers: [TasksApiService]
})
export class HandlerTopicStatusComponent {

  columns = [
    "name", "eduEmail", "eduPassword", "university", "course", "term", "collegeTerm", "active", "select"
  ];
  matcher = new SelectErrorStateMatcher();

  students = [];
  tasks: Task[] = [];
  allocationMap = new Map<any, any>();
  weeksArr: any[];
  private primarySubscripton: Subscription = new Subscription();
  taskStatusArr = Object.keys(TaskStatus).map(key => ({id: key, name: TaskStatus[key]}));
  weeks: any[];
  selectedCategory = [] ;
  query = {week: null, university: null, topic: null}
  filterActive: boolean;
  selectedstudentCourseDetails: Task;
  latestGrade: string;
  universities: University[];
  fg: any;
  topics: TopicLookup[];
  data: any;
  dataMap = new Map<string, any>();

  /**
   *
   */
  constructor(private universityApiService: UniversityApiService, private topicApiService: TopicsApiService, private fb: FormBuilder) {

    this.primarySubscripton.add(
      this.universityApiService.universities.subscribe((data) => {
          this.universities = cloneDeep(data);
      })
  );
  this.weeks = Array.from({length: 20}, (_, i) => i + 1);
  console.log(this.weeks);
  }
  
  ngOnInit() {
    this.universityApiService.getAllUniversities();
    this.topicApiService.getTopicCategories().subscribe(topics => this.topics = topics);
    this.fg = this.fb.group({
      university: ['', Validators.required],
      category: ['', Validators.required],
      week: ['', Validators.required]
    })
  }

  ngOnDestroy(): void {
    this.primarySubscripton.unsubscribe();
  }

  getAllTopicsByCategory(categoryId: string) {
    return this.dataMap.get(categoryId);
  }
  getAggregateByCategoryId(categoryId: string) {
    return {total: this.dataMap.get( categoryId + "-total"), pending: this.dataMap.get( categoryId + "-pending"), done: this.dataMap.get( categoryId + "-done")}
  }

  submit() {
    this.dataMap.clear();
    this.selectedCategory = this.fg.get("category").value === "all" ? this.topics : this.topics.filter(cat => cat.id === this.fg.get("category").value);
    this.topicApiService.getHandlerTopicStatus(this.fg.value).subscribe(data => {
      this.data = data;
      this.data.forEach(stat => {
        if (this.dataMap.has(stat.category.id)) {
          const values = (this.dataMap.get(stat.category.id) || []);
          this.dataMap.set(stat.category.id, [...values, stat]);
          this.dataMap.set(stat.category.id + "-total", this.dataMap.get(stat.category.id + "-total") + stat.total);
          this.dataMap.set(stat.category.id + "-pending", this.dataMap.get(stat.category.id + "-pending") + stat.pending);
          this.dataMap.set(stat.category.id + "-done", this.dataMap.get(stat.category.id + "-done") + stat.completed);
        } else {
          this.dataMap.set(stat.category.id, [stat]);
          this.dataMap.set(stat.category.id + "-total", stat.total);
          this.dataMap.set(stat.category.id + "-pending", stat.pending);
          this.dataMap.set(stat.category.id + "-done", stat.completed);
        }
      });
      console.log(this.dataMap);
    });
  }

}
