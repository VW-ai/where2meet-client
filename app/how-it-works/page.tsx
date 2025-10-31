'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Users, Vote, Search, Bell } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <h1 className="text-2xl font-bold text-black">How It Works</h1>
            <div className="w-24"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">
            Three Simple Ways to Meet
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Where2Meet makes group coordination effortless. Choose the method that works best for your situation.
          </p>
        </div>

        {/* Three Main Sections */}
        <div className="space-y-24">
          {/* Section 1: Find Meeting Point */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4">
                1. Find Meeting Point
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Perfect for small groups who want to quickly find a fair meeting spot. Add everyone's location and let our algorithm find the optimal venue.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Add Participants</h4>
                    <p className="text-gray-600">
                      Enter each person's location by typing their address or dropping a pin on the map. You can add up to 20 people.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Calculate Fairness</h4>
                    <p className="text-gray-600">
                      Our <strong>Welzl's algorithm</strong> calculates the Minimum Enclosing Circle (MEC) to ensure the meeting spot is fair for everyone.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Search Venues</h4>
                    <p className="text-gray-600">
                      Search for restaurants, cafes, parks, or any venue type. Results are ranked by rating, distance, and fairness to all participants.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Get Results</h4>
                    <p className="text-gray-600">
                      View top-rated venues with distances, ratings, and directions. Click any venue to see travel times for each participant.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500">
                <p className="text-sm text-blue-900">
                  <strong>Privacy First:</strong> All locations are processed locally or encrypted. We never store your exact coordinates without permission.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Alice • Downtown SF</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Bob • Mission District</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Carol • SOMA</span>
                  </div>
                </div>

                <div className="bg-blue-100 p-4 rounded-lg text-center">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-black">Optimal Meeting Point</p>
                  <p className="text-sm text-gray-600 mt-1">Union Square Area</p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-black">Blue Bottle Coffee</p>
                        <p className="text-sm text-gray-500">0.3 km • ⭐ 4.5</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Fair</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-black">Sightglass Coffee</p>
                        <p className="text-sm text-gray-500">0.5 km • ⭐ 4.7</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Fair</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Event Feed */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-white rounded-lg shadow-xl p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                    All
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    Sports
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    Entertainment
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">🏀 Pickup Basketball Game</h4>
                      <span className="text-xs bg-black/20 px-2 py-1 rounded">HOST</span>
                    </div>
                    <p className="text-sm mb-2">📍 Mission Dolores Park</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>👤 8/12</span>
                      <span>Today at 5:00 PM</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-black">🎬 Movie Night</h4>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">✓</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">📍 Finding location • 3 venues</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>👤 5/10</span>
                      <span>Tomorrow at 7:30 PM</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg opacity-75">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-black">☕ Coffee Meetup</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">📍 Downtown SF</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>👤 12/12</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">FULL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4">
                2. Event Feed
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Browse and join public events in your area. Perfect for discovering new activities and meeting people with shared interests.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Browse Events</h4>
                    <p className="text-gray-600">
                      Explore public events filtered by category (Sports, Entertainment), date, or location. Use "Near Me" to find events happening nearby.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Join or Create</h4>
                    <p className="text-gray-600">
                      Click "Join" to participate in any event. Or create your own event with a <strong>fixed location</strong> (exact venue) or <strong>collaborative</strong> (group decides).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Real-Time Updates</h4>
                    <p className="text-gray-600">
                      Get instant notifications when participants join, vote, or when the location is finalized. Uses <strong>Server-Sent Events (SSE)</strong> for live updates.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Collaborate</h4>
                    <p className="text-gray-600">
                      For collaborative events, suggest venues, vote on options, and see what other participants prefer in real-time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-500">
                <p className="text-sm text-orange-900">
                  <strong>Two Event Types:</strong> Fixed location events have a set venue. Collaborative events let the group vote on where to meet.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Other People's Lists */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4">
                3. Other People's Lists
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Discover curated venue lists created by the community. Save time by using someone else's research for your next meetup.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Browse Curated Lists</h4>
                    <p className="text-gray-600">
                      Explore venue collections organized by category, theme, or neighborhood. Each list shows venue count, likes, and preview venues.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">View List Details</h4>
                    <p className="text-gray-600">
                      Click any list to see all venues with ratings, addresses, and photos. See what makes each spot special according to the curator.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Use for Meeting Planning</h4>
                    <p className="text-gray-600">
                      Click "Use These Venues for Meeting" to import the entire list into a new event. Let your group vote on which venue to visit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Create Your Own</h4>
                    <p className="text-gray-600">
                      Share your favorite spots with the community. Create lists for different occasions: date nights, family-friendly, late-night eats, etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-500">
                <p className="text-sm text-purple-900">
                  <strong>Community Powered:</strong> Like lists you love and they'll appear higher in search results. Quality lists get more visibility.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
              <div className="space-y-4">
                <h4 className="font-bold text-black text-lg mb-4">Popular Lists</h4>

                <div className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-black">Best Coffee Shops in SF</h5>
                    <span className="text-sm text-gray-500">❤️ 142</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">12 venues • by @coffee_lover</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">☕ Blue Bottle</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">☕ Sightglass</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">+10 more</span>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-black">Date Night Restaurants</h5>
                    <span className="text-sm text-gray-500">❤️ 89</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">8 venues • by @foodie_sf</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">🍝 Flour + Water</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">🥩 House of Prime</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">+6 more</span>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-black">Outdoor Basketball Courts</h5>
                    <span className="text-sm text-gray-500">❤️ 56</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">15 venues • by @hoops_squad</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">🏀 Mission Park</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">🏀 Dolores Park</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">+13 more</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors">
                  Browse All Lists
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Features Section */}
        <div className="mt-24 bg-gray-900 text-white rounded-2xl p-8 md:p-12">
          <h3 className="text-3xl font-bold mb-8 text-center">Powered by Advanced Technology</h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Welzl's Algorithm</h4>
              <p className="text-gray-300 text-sm">
                Calculates the Minimum Enclosing Circle (MEC) to find the most geographically fair meeting point for all participants.
              </p>
            </div>

            <div>
              <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Real-Time SSE</h4>
              <p className="text-gray-300 text-sm">
                Server-Sent Events (SSE) with Redis pub/sub ensure instant updates when participants join, vote, or locations change.
              </p>
            </div>

            <div>
              <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Smart Caching</h4>
              <p className="text-gray-300 text-sm">
                Three-tier caching (Redis, Database, Google API) reduces latency and costs while providing lightning-fast venue searches.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-3xl font-bold text-black mb-4">
            Ready to Find Your Perfect Meeting Spot?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of groups coordinating better meetings with Where2Meet.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started Now
            </Link>
            <Link
              href="/#features"
              className="px-8 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
