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

async function createProduct(product, variant) {
	console.log(product)
	console.log(variant)
	var newProduct = {}
	const conn = await pool.getConnection();
  await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await conn.beginTransaction();
  try {
    const [result] = await conn.query('INSERT INTO product SET ?', product);
		for (let index = 0; index < variant.length; index++) {
			await conn.query("INSERT INTO variant(product_id, color_id, size, stock) VALUES (?, ?, ?, ?)", [result.insertId, variant[index].color_id, variant[index].size, variant[index].stock])
		}
    await conn.commit();
		newProduct.id = result.insertId
    return newProduct;
  } catch (error) {
    conn.rollback();
    console.log(error)
    newProduct.id = '-1'
    return newProduct;
  } finally {
    await conn.release();
  }
}

async function updateProduct(newInfo) {
	const conn = await pool.getConnection();
  await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await conn.beginTransaction();
  try {
		if (newInfo.category !== undefined) await conn.query("UPDATE product SET category = ? WHERE id = ?", [newInfo.category, newInfo.id])
		if (newInfo.title !== undefined) await conn.query("UPDATE product SET title = ? WHERE id = ?", [newInfo.title, newInfo.id])
		if (newInfo.description !== undefined) await conn.query("UPDATE product SET description = ? WHERE id = ?", [newInfo.description, newInfo.id])
		if (newInfo.price !== undefined) await conn.query("UPDATE product SET price = ? WHERE id = ?", [newInfo.price, newInfo.id])
		if (newInfo.texture !== undefined) await conn.query("UPDATE product SET texture = ? WHERE id = ?", [newInfo.texture, newInfo.id])
		if (newInfo.wash !== undefined) await conn.query("UPDATE product SET wash = ? WHERE id = ?", [newInfo.wash, newInfo.id])
		if (newInfo.place !== undefined) await conn.query("UPDATE product SET place = ? WHERE id = ?", [newInfo.place, newInfo.id])
		if (newInfo.note !== undefined) await conn.query("UPDATE product SET note = ? WHERE id = ?", [newInfo.note, newInfo.id])
		if (newInfo.story !== undefined) await conn.query("UPDATE product SET story = ? WHERE id = ?", [newInfo.story, newInfo.id])
		if (newInfo.main_image !== undefined) await conn.query("UPDATE product SET main_image = ? WHERE id = ?", [newInfo.main_image, newInfo.id])
		if (newInfo.inventory !== undefined) {
			const newInventory = JSON.parse(newInfo.inventory.replace(/'/g, '"'))
			const inventoryQuery = 'SELECT id, color_id, size FROM variant WHERE product_id = ?';
			const inventoryBindings = [newInfo.id];
			const [inventory] = await conn.query(inventoryQuery, inventoryBindings);
			for (let i = 0; i < newInventory.length; i++) {
				for (let j = 0; j < inventory.length; j++) {
					if (newInventory[i].color_id == inventory[j].color_id && newInventory[i].size == inventory[j].size) {
						await conn.query("UPDATE variant SET stock = ? WHERE id = ?", [newInventory[i].stock, inventory[j].id])
						break
					}
					else if (j == inventory.length - 1)
						await conn.query("INSERT INTO variant(product_id, color_id, size, stock) VALUES (?, ?, ?, ?)", [newInfo.id, newInventory[i].color_id, newInventory[i].size, newInventory[i].stock])
				}
			}
		}
    await conn.commit();
    return getProduct(newInfo.id)
  } catch (error) {
    conn.rollback();
    console.log(error)
    newProduct.id = '-1'
    return newProduct;
  } finally {
    await conn.release();
  }
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
	type ProductID {
		id: String
	}

	# The "Query" type is special: it lists all of the available queries that
	# clients can execute, along with the return type for each. In this
	# case, the "books" query returns an array of zero or more Books (defined above).
	type Query {
		product(id: String): Product
		products(category: String): [Product]
	}
	type Mutation {
		createProduct(category: String, title: String, description: String, price: Int, texture: String, wash: String, place: String, note: String, story: String, main_image: String, inventory: String): ProductID
		updateProduct(id: String!, category: String, title: String, description: String, price: Int, texture: String, wash: String, place: String, note: String, story: String, main_image: String, inventory: String): Product
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
				const product = {}
				const variant = JSON.parse(args.inventory.replace(/'/g, '"'))
				for (let index = 0; index < Object.keys(args).length - 1; index++) {
					product[Object.keys(args)[index]] = args[Object.keys(args)[index]]
				}
				return createProduct(product, variant)
			},
			updateProduct: (root, args, context) => {
				return updateProduct(args)
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