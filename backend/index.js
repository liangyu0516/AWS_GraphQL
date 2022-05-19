const { ApolloServer, gql } = require('apollo-server');
const {pool} = require('./mysqlcon');

async function getProduct(id) {
	const productQuery = 'SELECT product.* FROM product WHERE product.id = ?';
	const productBindings = [parseInt(id)];
	const [[product]] = await pool.query(productQuery, productBindings);

	const inventoryQuery = 'SELECT variant.* FROM variant WHERE variant.product_id = ?';
	const inventoryBindings = [parseInt(id)];
	const [inventory] = await pool.query(inventoryQuery, inventoryBindings);
	product.inventory = JSON.stringify(inventory)

	return product
}

async function getProductList(category) {
	const productListQuery = 'SELECT product.* FROM product WHERE product.category = ?';
	const productListBindings = [category];
	const [productList] = await pool.query(productListQuery, productListBindings);
	console.log(productList)

	for (let index = 0; index < productList.length; index++) {
		const inventoryQuery = 'SELECT color_id, size, stock FROM variant WHERE variant.product_id = ?';
		const inventoryBindings = [productList[index].id];
		const [inventory] = await pool.query(inventoryQuery, inventoryBindings);
		productList[index].inventory = JSON.stringify(inventory)
	}

	return productList
}

async function createProduct(product) {
	const productListQuery = 'SELECT product.* FROM product WHERE product.category = ?';
	const productListBindings = [category];
	const [productList] = await pool.query(productListQuery, productListBindings);
	return productList
}

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
	# This "Book" type defines the queryable fields for every book in our data source.
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
		inventory: String
	}

	# The "Query" type is special: it lists all of the available queries that
	# clients can execute, along with the return type for each. In this
	# case, the "books" query returns an array of zero or more Books (defined above).
	type Query {
		product(id: String): Product
		products(category: String): [Product]
	}
	type Mutation {
		createProduct(category: String, title: String, description: String, price: Int, texture: String, wash: String, place: String, note: String, story: String, main_image: String): Product
	}
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
		Query: {
				product: (root, args, context) => {
					return getProduct(args.id)
				},
				products: (root, args, context) => {
					return getProductList(args.category)
				},
		},
		Mutation: {
			createProduct: (root, args, context) => {
				return createProduct(args)
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