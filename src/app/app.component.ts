import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError, of, forkJoin, combineLatest, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, switchMap, filter, first } from 'rxjs/operators';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  name = 'Angular';
  todoUrl = 'https://jsonplaceholder.typicode.com/todos';
  userUrl = 'https://jsonplaceholder.typicode.com/users';
  postUrl = 'https://jsonplaceholder.typicode.com/posts';

  // Action stream
  private userSelectedSubject = new BehaviorSubject<string>('');
  userSelectedAction$ = this.userSelectedSubject.asObservable();

  // All ToDo's
  todos$ = this.http.get<ToDo[]>(this.todoUrl)
    .pipe(
      tap(data => console.log('todos', JSON.stringify(data))),
      catchError(err => throwError('Error occurred'))
    );

  // All Users
  users$ = this.http.get<User[]>(this.userUrl)
    .pipe(
      // tap(data => console.log('users', JSON.stringify(data))),
      catchError(err => throwError('Error occurred'))
    );

  // One user's todo's
  // This example hard-codes a username.
  // Returns the todo's for a specific user
  userName = 'Kamren';
  todosForUser$ = this.http.get<User[]>(`${this.userUrl}?username=${this.userName}`)
    .pipe(
      map(users => users[0]),
      switchMap(user =>
        this.http.get<ToDo[]>(`${this.todoUrl}?userId=${user.id}`)
      )
    );

  // One user's todo's
  // This example hard-codes a username
  // Returns both the user name and todo's
  todosForUser2$ = this.http.get<User[]>(`${this.userUrl}?username=${this.userName}`)
    .pipe(
      map(users => users[0]),
      switchMap(user =>
        forkJoin(
          this.http.get<ToDo[]>(`${this.todoUrl}?userId=${user.id}`)
        )
          .pipe(
            map(([todos]) => ({
              name: user.name,
              todos: todos,
              posts: []
            }) as UserData)
          )
      )
    );

  // Get multiple sets of related data and return it all as a single object
  // Uses hard-coded userName
  dataForUser2$ = this.http.get<User[]>(`${this.userUrl}?username=${this.userName}`)
    .pipe(
      // This particular http request returns an array.
      // We only want the first element.
      map(users => users[0]),
      switchMap(user =>
        combineLatest([
          this.http.get<ToDo[]>(`${this.todoUrl}?userId=${user.id}`),
          this.http.get<Post[]>(`${this.postUrl}?userId=${user.id}`)
        ])
          .pipe(
            map(([todos, posts]) => ({
              name: user.name,
              todos: todos,
              posts: posts
            }) as UserData)
          )
      )
    );

  // Gets multiple sets of related data and returns it all as a single object
  // Uses an action stream to "pass in" the parameter for the first query.
  // Uses combineLatest
  dataForUser3$ = this.userSelectedAction$
    .pipe(
      // Handle the case of no selection
      filter(userName => Boolean(userName)),
      // Get the user given the user name
      switchMap(userName => this.http.get<User[]>(`${this.userUrl}?username=${userName}`)
        .pipe(
          // The query returns an array of users, we only want the first one
          map(users => users[0]),
          switchMap(user =>
            // Pull in any related streams
            combineLatest([
              this.http.get<ToDo[]>(`${this.todoUrl}?userId=${user.id}`),
              this.http.get<Post[]>(`${this.postUrl}?userId=${user.id}`)
            ])
              .pipe(
                // Map the data into the desired format for display
                map(([todos, posts]) => ({
                  name: user.name,
                  todos: todos,
                  posts: posts
                }) as UserData)
              )
          )
        )
      )
    );

  // Gets multiple sets of related data and returns it all as a single object
  // Uses an action stream to "pass in" the parameter for the first query.
  // Uses forkJoin
  dataForUser$ = this.userSelectedAction$
    .pipe(
      // Handle the case of no selection
      filter(userName => Boolean(userName)),
      // Get the user given the user name
      switchMap(userName => this.http.get<User[]>(`${this.userUrl}?username=${userName}`)
        .pipe(
          // The query returns an array of users, we only want the first one
          map(users => users[0]),
          switchMap(user =>
            // Pull in any related streams
            forkJoin([
              this.http.get<ToDo[]>(`${this.todoUrl}?userId=${user.id}`),
              this.http.get<Post[]>(`${this.postUrl}?userId=${user.id}`)
            ])
              .pipe(
                // Map the data into the desired format for display
                map(([todos, posts]) => ({
                  name: user.name,
                  todos: todos,
                  posts: posts
                }) as UserData)
              )
          )
        )
      )
    );

  constructor(private http: HttpClient) { }

  onSelected(userName: string): void {
    this.userSelectedSubject.next(userName);
  }
}

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string
}

export interface ToDo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  website: string;
}

export interface UserData {
  name: string;
  posts: Post[];
  todos: ToDo[];
}
