const { ApolloServer, gql } = require('apollo-server');
const {pool} = require('./mysqlcon');

async function getProduct(id) {
  console.log(id)
  const productQuery = 'SELECT product.* FROM product WHERE product.id = ?';
  const productBindings = [parseInt(id)];
  const [product] = await pool.query(productQuery, productBindings);

  return product[0]
}

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  type Product {
    id: String
    category: String
    title: String
    description: String
    price: Int
    texture: String
    wash: String
    place: String
    note: String
    story: String
    main_image: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    book(author: String, title: String): Book
    books(author: String): [Book]
    product(id: String): Product
    products: [Product]
  }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        book: (root, args, context) => {
          console.log(args)
          return book
        },
        books: () => books,
        product: (root, args, context) => {
          return getProduct(args.id)
        },
    },
  };

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
  });
  
// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});