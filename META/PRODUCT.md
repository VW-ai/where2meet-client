# Product Design

This file is a comprehensive product guideline focusing on the desired features and user experience of the project.  
It includes:  
1. **Background**: Current situation and existing problems.  
2. **Solution**: High-level product description, what problems we aim to solve and how.  
3. **Workflow**: All workflows from a user perspective, highlighting key features.  
4. **Deliverable**: Standards and milestones the end product should accomplish.  

---

## Abstract

*Where to Meet* is designed to provide organizers with a convenient online solution for selecting group meeting locations. By generating a unique link, users can enter a shared interface, add their geographic location, and propose potential meeting spots. The platform aggregates all submitted data and applies lightweight algorithms to compute an optimized meeting point.  

This document outlines the background, core problems, system design, data model, algorithms, architecture, and security considerations of *Where to Meet*.

---

## 1. Background

### 1.1 Situation
Traditional group gatherings often rely on manual discussions or subjective preferences, leading to inefficiency and bias in deciding meeting places. With the ubiquity of mobile internet and location-based services, it is increasingly feasible to design an automated, data-driven decision-making system for selecting meeting locations. Inspired by [When2Meet](https://www.when2meet.com/), which addresses scheduling coordination, *Where to Meet* focuses on **location coordination**.

### 1.2 Problem
In group meetups, how can we fairly and efficiently determine an optimal location that balances convenience and preferences? Key challenges include:
1. **Data Collection**  
   Ensuring participants can easily submit their location and suggestions.
2. **Data Aggregation**  
   Processing multiple data points to reduce bias, handle extreme values, and extract useful information.
3. **Optimal Location Decision**  
   Designing algorithms to identify balanced, fair, and practical meeting points based on input.
4. **Route Visualization** 
	The group meetup organizer can see all the routes from participants to the meeting point.nbvb;

---

## 2. Solution

We propose *Where to Meet*, a **lightweight, location-based group decision platform** that leverages real-time data submission, privacy-aware visualization, and location optimization algorithms.

### Core Interfaces
1. **Web/Mobile Interface**  
   - Participants join via a unique event link.  
   - Map-based interface to submit and view (anonymized) locations and suggestions.  

2. **Backend Service**  
   - Stores and processes participant data.  
   - Runs optimization algorithms (e.g., centroid-based, circle-based candidate search).  
   - Pushes updates to all users in real time.  

3. **Decision Support Features**  
   - Automatic generation of candidate meeting points.  
   - Voting mechanism for participants to express preferences.  
   - Optional host-driven or collaborative decision workflows.

---

## 3. Workflow

### 3.1 Host (Organizer)
- **Create Event**: Defines theme, location type (restaurant, café, basketball court, etc.), and time window.  
- **Manage Participants**: Reviews anonymous location submissions; controls visibility settings.  
- **Generate Candidate Locations**:  
  - Default: Centroid algorithm.  
  - **Circle-based search**: After aggregating participant locations, the system computes a central point and draws a circle covering all participants.  
  - The algorithm then queries location databases (e.g., restaurants, basketball courts) and pinpoints all matching POIs inside the circle.  
- **Coordinate Decision Process**:  
  - Enables or disables voting.  
  - Sets deadlines for decisions.  

### 3.2 Guest (Participant)
- Submits location (latitude, longitude, timestamp).  
- Suggests potential meeting places with optional reasons/weights.  
- Votes on candidate meeting places (if enabled).  
- Views final decision and suggested travel routes (if allowed).  

---

## 4. System Architecture

### 4.1 Frontend
- Web/mobile interface (responsive design).  
- Map visualization of anonymous user inputs.  
- Location and suggestion submission forms.  

### 4.2 Backend
- RESTful APIs for event creation, data submission, and candidate retrieval.  
- **Algorithm Service**:  
  - Centroid calculation (geometric center of all inputs).  
  - Circle construction: compute minimum bounding circle covering all participants.  
  - POI filtering: query external APIs (Google Maps, Yelp) for specified location types (e.g., “basketball court”) within circle boundaries.  
  - Candidate ranking: sort results by distance, rating, and preference weighting.  
- Real-time updates via WebSocket or server-sent events.  

### 4.3 Data Model
- **Event**: Event ID, host info, settings (privacy, voting, decision mode).  
- **Participant**: Anonymous ID, location data, timestamp, suggestions.  
- **Candidate Location**: Name, coordinates, metadata (photos, ratings, distance).  
- **Vote**: User ID, candidate ID, weight.  

### 4.4 Security & Privacy
- All location data stored anonymously (no exact user identity revealed).  
- Host may toggle visibility of participants’ locations.  
- Encrypted communication (HTTPS).  
- Data retention policies to delete events after a defined period.  

---

## 5. Future Directions
- Integration with third-party services (Google Maps, Yelp).  
- Advanced algorithms (multi-objective optimization, fairness guarantees).  
- AI-driven recommendations (personalized venue suggestions based on user history).  
- Cross-platform availability (native apps, WeChat mini-program).  

---