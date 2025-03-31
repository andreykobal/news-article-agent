export const typeDefs = `#graphql
  type Article {
    title: String!
    content: String!
    url: String!
    date: String!
  }

  type QueryResponse {
    answer: String!
    sources: [Article!]!
  }

  type Query {
    queryNews(query: String!): QueryResponse!
  }
`; 