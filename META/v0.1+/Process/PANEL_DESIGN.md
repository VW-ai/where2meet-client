# Panel on the left
I think one thing is, everything that user needs to control, all the panels, should be on the left of the screen(for web), 
and after all, there is not much panel, so they all can align verticall, the rough idea is from the bottom to down following are the views:
## 1. Input view. have the followoing sections: section
1. input your name (optionl), 2. input your address (google map autocomplete like what we have) 3. a button that let's the user use their current location, a button to blur their location ( into a +-15 coordinates), and a button Confirm the input)
## 2.Venues View
You can select two sub views in this part through button:
1. search
2. venue lists
### Search
This is simple, we have a toggle under the search, that determines whether you are search by location type or location name (we have current implementation for this, we just need to resuse the logics), if by type, we have some suggested type to begin with that you can select (or type directly also work), if by name, then we have the google map autocomplete
Either way, we preserve our existing  sort by rating/distance, better with UI that saves more space to determine which sort to go with.
### venue lists
People's seleection will be here.
This shows the added venue and their voting status. Clicking on an venue here will make the map zoom in just enough so that the circle that we got is 60% of the screen, with the venue just selected at the center of the screen, and it will be at the state which we also trigger when we hover on the spot on map: showing a crad preview, shows some pictures, reviews star level and review amount basic logistics like opening hour, website, contact, link to google map, and a button looks like the full screen button, which will expand the card, so that the card becomes bigger and scrollable for comments.
On the panel, people can choose click a button, the first time user clicked it, add a vote (vote count changes), the second time it is unvote.
we keep the event with most vote on top, if same vote, ranked by the time the venue is added to this selection list. However on it, shows how has voted on this venue. 

## 3.Paricipation View
This view serves as the same purpose as the currently Participate Locations
except,  each one has a name (only display like the first 10 letters of the name, by default), and their location(adjusted coordinate if privacy set, otherwise the address), and the colored triangle, each with different color, the same colored square will be representing them on the map (we have the representation alreayd down on map). clicking an entry in this part would move the part to that persons address (do not zoom in too much), and the square representing that persons location will be a little bigger.
this list's space is scrollable. 

# Panel on the right
We will put our search Area size on the top right of the screen.

# Top Panel fixes
1. we will not need to show how many venues are within our condition of search, because this is can be reflected in the search page. we do not need to show the radius, because the search Area size.
2. We will redesign the rest of the top panel, to make everything more compacted, not wasting so many space.
