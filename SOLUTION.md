# Solution documentation
As it was requested to be a brief documentation, I will be as straight forward as possible at the start,
but there are some things that worth discussing. Those will be at the "Discussion" section.

## Overview
The assignment was simple, the requirements were mostly straightforward and often times event
had comments to guide the developer.

## Notice of AI usage
It's important to mention that an AI tool was used to help with the development.
This assignment was done with the Cursor Editor, which provides autocompletion and code generation. 
Although the usage of AI tools might be seen "cheating", I made the conscious decision to use it 
because I strongly believe that the use of AI agents is no longer just a crutch
for low skilled developers, but rather, a core tool in software development.

For reference, the past two companies I've worked for had company-wide policies to promote
the usage of AI tools. My past job migrated to Lovable for making prototypes, and my job 
before that literally bought a license for Cursor for the entire company.

Since the usage of tools like this one during my daily work is unevitable, I would rather use
all of the tools available to me instead of limiting my productivity for the sake of a test.

## Pros and Cons
Aside from the things mentioned in the "Discussions" section, the changes made are straight up improvements
on what previously existed, so it's hard to argue for most of it to be a con.

## Discussions
### 1. Cookies?
Although not documented on the README, the applciation was trying to fetch an API request on a
method which was, assumedly, supposeded to fetch a cookie.
But it really only worked as a way to make the project not run. The method was removed.

### 2. Pagination & Server-Side Search
Implemented server-side pagination with configurable page size and added debounced search functionality
to prevent unnecessary API calls. Added a filter function as well. This should provide better performance and
scalability, but it does make the state management and API consumption more complex.

### 3. Virtualization for Performance
Integrated `react-window` and `react-window-infinite` for efficient list rendering.
Provides better performance with more items, but requires a fixed height for better calculations
and also means that the project has a new dependency, which may cause issues over the lifespan
of the project (if the depency stops being supported)

### 4. Enhanced UI/UX
Added loading skeletons with smooth animations, error and empty states and some attention to responsiveness
