import { Component, Input, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from 'app/models/user.model';
import { University } from 'app/models/university.model';
import { UniversityApiService } from 'app/core/university/universityapi.service';
import { Subscription, combineLatest } from 'rxjs';
import { cloneDeep } from 'lodash';
import { NoDataFoundComponent } from 'app/layout/common/no-data-found/no-data-found.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { Course } from 'app/models/course.model';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuseUtilsService } from '@fuse/services/utils';
import { Term } from 'app/models/term.model';
import { TermApiService } from 'app/core/term/termapi.service';
import { TasksApiService } from 'app/core/tasks/tasksapi.Service';
import { Task } from 'app/models/task.model';
import { MatTableModule } from '@angular/material/table';
import { Topic } from 'app/models/topic.model';
import { TopicLookup } from 'app/core/tasks/topicsapi.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, NoDataFoundComponent, MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatTableModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  providers: [TasksApiService]
})
export class TeamComponent implements OnDestroy {
  private primarySubscripton: Subscription = new Subscription();
  @Input() selectedUniversity: University;
  columns = ["mentor", "week", "postedBy", "subject", "topics", 'count', "total"];

  showMsg = false;
  mentors: User[];
  courses: Course[];
  filterTasksForm: any;
  weeks: number[] = Array.from({ length: 18 }, (_, index) => 1 + index);
  queryParams: {
    university: any; assignedMentors: any[]; week: any; term: any;
};
  terms: Term[];
  selectedMentor: User;
  tasks: Task[];
  filteredTasks: Task[];
  weekwiseData: {};
  weeksArr: string[];
  allocationMap = new Map<any, any>();

  constructor(private fb: FormBuilder, private utils: FuseUtilsService, private taskApiService: TasksApiService, private termApiService: TermApiService, private universityApiService: UniversityApiService, private courseApiService: CourseApiService) {
  
    this.primarySubscripton.add(
      this.taskApiService.tasksForReport.subscribe((data) => {
          this.tasks = cloneDeep(data);
          this.tasks.forEach(task => {
            task.university = this.selectedUniversity;
            task.topics = (task.topics as Topic[]).map(topic => {
              if (!!(topic.topic as TopicLookup)?.id) {
                return topic;
              }
            }).filter(topic => !!topic);
          });
          this.filteredTasks = cloneDeep(this.tasks);
          this.groupByWeek(this.filteredTasks);
          console.log(this.filteredTasks, "new list retrieved!");
      })
  );
  
  }

  sortTopicsByPostedById(arr: Topic[]) {
    return arr.sort((a, b) => {
      const idA = a.postedBy?.id ? a.postedBy?.id : 'NA';
      const idB = b.postedBy?.id ? b.postedBy?.id : 'NA';
      if (idA < idB) {
          return -1;
      }
      if (idA > idB) {
          return 1;
      }
      return 0;
    });
  }

  uniqueTopicsByPostedByIdCourseIdTopicId(arr: Topic[], courseId: string) {
    const uniqueTopics = arr.length ? this.allocationMap.get(arr[0].week) || [] : [];
    console.log("predata of uniquetopics", uniqueTopics)
    arr.forEach(topic => {
      const similarTopicIndexWithSamePostedByAndCourseId = 
      uniqueTopics.findIndex(clusterTopics => clusterTopics.topic?.id === (topic.topic as TopicLookup)?.id && clusterTopics.postedBy?.id === topic.postedBy?.id && topic.course.id === courseId );
      if (similarTopicIndexWithSamePostedByAndCourseId < 0) {
        topic.count = 1;
        uniqueTopics.push(topic);
      } else {
        uniqueTopics[similarTopicIndexWithSamePostedByAndCourseId].count += 1;
      }
    });
    console.log(arguments, uniqueTopics, arr);
    return uniqueTopics;
  }

  groupByWeek(tasks: Task[]) {
    this.weekwiseData = {}; 
    this.allocationMap.clear();
    tasks.forEach(task => {

      if (task.topics?.length) {
        task.topics.forEach(topic => topic.course = task.course);
        task.topics = this.uniqueTopicsByPostedByIdCourseIdTopicId(task.topics as Topic[], task.course.id);
  
        // Week wise
        if (this.allocationMap.has(task.week)) {
          let arr = this.allocationMap.get(task.week);
          arr = [...arr, ...task.topics];
          arr = cloneDeep(task.topics).map((topic) => {
            topic.course = task.course;
            return topic;
          });
          arr = this.sortTopicsByPostedById(arr);
          this.allocationMap.set(task.week, arr);
        } else {
          let arr = cloneDeep(task.topics).map((topic) => {
            topic.course = task.course;
            return topic;
          });
          this.allocationMap.set(task.week, [...this.sortTopicsByPostedById(arr as Topic[])]);
        }
        // week with PostedBy wise
       this.allocationMap.get(task.week)?.forEach(topic => {
          const dynamicId = task.week+'-'+'PostedBy-'+(topic.postedBy?.id ? topic.postedBy.id : 'NA');
          if(this.allocationMap.has(dynamicId)) {
            const arr = this.allocationMap.get(dynamicId);
            if (!arr.some(uniqueTopic => uniqueTopic.id === topic.id)) {
              arr.push(topic);
              this.allocationMap.set(dynamicId, arr);
            }
          } else {
            this.allocationMap.set(dynamicId, [topic]);
          }
  
        });
  
        // PostedBy with Course wise
        this.allocationMap.get(task.week)?.forEach(topic => {
          const dynamicId = task.week+'-'+'PostedBy-'+(topic.postedBy?.id ? topic.postedBy.id : 'NA') + '-Course-'+task.course?.id;
          if(this.allocationMap.has(dynamicId)) {
            const arr = this.allocationMap.get(dynamicId);
            if (!arr.some(uniqueTopic => uniqueTopic.id === topic.id)) {
              arr.push(topic);
              this.allocationMap.set(dynamicId, arr);
            }
          } else {
            this.allocationMap.set(dynamicId, [topic]);
          }
  
        });
      }
     
      
    });
    console.log(this.allocationMap);
    tasks.forEach(task => {
      if (task.week in this.weekwiseData) {
        this.weekwiseData[task.week].push(task);
      } else {
        this.weekwiseData[task.week] = [task];
      }
    });
    this.weeksArr = Object.keys(this.weekwiseData);
  }

  getPostedByCountByWeek(week: number, postedById: string) {
    return this.allocationMap.get(`${week}-PostedBy-${postedById ? postedById : 'NA'}`);
  }
  getCourseCountByPostedByAndWeek(week: number, postedById: string, courseId: string) {
    return this.allocationMap.get(`${week}-PostedBy-${postedById ? postedById : 'NA'}-Course-${courseId}`);
  }
  getCourseTopicsCountByPostedByAndWeek(week: number, postedById: string, courseId: string) {
    let sum = 0;
    this.allocationMap.get(`${week}-PostedBy-${postedById ? postedById : 'NA'}-Course-${courseId}`)
    .forEach(topic => sum += topic.count);
    return sum;
  }

  getAllTopicsByWeek(week: string) {
    return this.allocationMap.get(+week);
  }

filterByQuery(searchText: string) {
  console.log(searchText);
}

ngOnDestroy(): void {
    this.primarySubscripton.unsubscribe();
}

ngOnChanges(changes: SimpleChanges) {
  console.log(changes);
  if (!changes.selectedUniversity.isFirstChange()) {
    this.ngOnInit();
  }
}

ngOnInit(): void {

  this.queryParams = {assignedMentors: [], university: null, week: null, term: null};


  // Filter Form
  this.filterTasksForm = this.fb.group(
    {
        week: ['', Validators.required],
        mentorAssigned: ['', Validators.required],
        term: ['', Validators.required],
        university: [this.selectedUniversity?.id, Validators.required]
    }
);

  this.primarySubscripton.add(
    this.universityApiService.mentors.subscribe((users) => {
        this.mentors = cloneDeep(users);
        this.showMsg = users !== null;
    })
  );
  this.primarySubscripton.add(
    this.termApiService.terms.subscribe(terms => this.terms = terms)
  );
  this.termApiService.getAllterms(this.selectedUniversity.id);
  this.universityApiService.getAssignedMentorsForUniversity(this.selectedUniversity.id);
  this.courseApiService.getAllcourses(this.selectedUniversity?.id);

  this.filterTasksForm.controls.mentorAssigned.valueChanges.subscribe(d => {
    this.selectedMentor = this.mentors.find(mentor => mentor._id === d)
  })

  this.filterTasksForm.valueChanges.subscribe(v => {
    if (this.filterTasksForm.valid) {
      this.queryParams.term = v.term;
      this.queryParams.assignedMentors = v.mentorAssigned;
      this.queryParams.week = v.week;
      this.queryParams.university = v.mentorAssigned;
    }
    this.taskApiService.getAllTasksForHandlerAllocation(this.selectedUniversity.id, this.queryParams);

  }); 
    
}

}
