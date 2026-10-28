# cms-contentful — open risks

What is not yet proven or not yet decided. The full write-up of every risk,
including the accepted ones, is
`specs/epics/cms-contentful/risks-and-open-questions.md`; this page lists only
what is still live, so it should be short.

| ID | Risk | State | What closes it |
|---|---|---|---|
| CC-A | Not proven live: repository creation, the brokered token, a real deploy and the probes, and a connected blog reading a real space through the Worker | OPEN | One bootstrap from a tag against a workspace, then a Contentful space connected to it |
| CC-B | Draft mode has not met a real space: the route is tested with a mocked fetch and served unconnected | OPEN | The first connected product opens one post's Contentful preview through the Worker |

Accepted, and worth knowing before you change them: CC-C (every page view
is a GraphQL request, answered by Contentful's CDN), CC-D (setting a secret
redeploys nothing), CC-E (the delivery token is in the server bundle), CC-H
(a wrong space id or token shows an empty blog, not an error).
