// Tutorial from : https://www.youtube.com/watch?v=ZQL7tL2S0oQ
const express = require('express')
const { graphqlHTTP } = require("express-graphql");
const { GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLList,
	GraphQLNonNull,
	GraphQLInt,
	GraphQLMutation
} = require('graphql')
const app = new express()
const PORT = 3000

const books = require('./books')
const authors = require('./authors')

const BookType = new GraphQLObjectType({ // Custom graphql object that is passed into rootquerytype that tells query what to return depnding on the query
	name: 'Book',
	description: 'This represents a book written by an author',
	fields: () => ({
		id: { type: GraphQLNonNull(GraphQLInt) }, // don't need an explicit resolve because we already have an id property on our object that it will automatically return if resole isn't specified
		name: { type: GraphQLNonNull(GraphQLString) },
		authorId: { type: GraphQLNonNull(GraphQLInt) },
		author: {
			type: AuthorType,
			resolve: (book) => authors.find(author => author.id === book.authorId) //first param is parent which is the book object
		}
	})
})

const AuthorType = new GraphQLObjectType({
	name: 'Author',
	description: 'This represents author of a book',
	fields: () => ({ //Needs to be wrapped in a function because AuthorType references BookType and vice versa, so there will be an undefined error if it immediately returns just an object, need to wrap in an automatically called function
		id: { type: GraphQLNonNull(GraphQLInt) },
		name: { type: GraphQLNonNull(GraphQLString) },
		books: {
			type: new GraphQLList(BookType),
			resolve: (author) => books.filter(book => author.id === book.authorId)
		}
	})
})

const RootQueryType = new GraphQLObjectType({
	name: 'Query',
	description: 'root query',
	fields: () => ({ //wrapped in parens so that it immediately returns
		books: {
			type: new GraphQLList(BookType), //List of BookTypes
			description: 'List of all books',
			resolve: () => books
		},
		authors: {
			type: new GraphQLList(AuthorType),
			description: 'List of all authors',
			resolve: () => authors
		},
		book: {
			type: BookType, //List of BookTypes
			description: 'Single book ',
			args: {
				id: { type: GraphQLInt }
			},
			//2nd param of resolve takes in object from the query
			resolve: (parent, args) => books.find(book => book.id === args.id)
		},
		author: {
			type: AuthorType, //List of BookTypes
			description: 'Single author',
			args: {
				id: { type: GraphQLInt }
			},
			//2nd param of resolve takes in object from the query
			resolve: (parent, args) => authors.find(author => author.id === args.id)
		},
	})
})

// Mutations are like REST POST, PUT, DELETE, but for graphql
const RootMutationType = new GraphQLObjectType({
	name: 'Mutation',
	description: "Root Mutation",
	fields: () => ({
		addBook: {
			type: BookType,
			description: 'Add a book',
			args: {
				name: { type: GraphQLNonNull(GraphQLString) },
				authorId: { type: GraphQLNonNull(GraphQLInt) },
			},
			resolve: (parent, args) => {
				const book = { id: books.length + 1, name: args.name, authorId: args.authorId }
				books.push(book)
				return book
			}
		},
		addAuthor: {
			type: AuthorType,
			description: 'Add an author',
			args: {
				name: { type: GraphQLNonNull(GraphQLString) },
			},
			resolve: (parent, args) => {
				if (!authors.some(author => author.name === args.name)) {
					const author = { id: authors.length + 1, name: args.name }
					authors.push(author)
					return author
				}
				throw new Error("Author already in database")
			}
		}
	})
})

const schema = new GraphQLSchema({
	query: RootQueryType,
	mutation: RootMutationType
})

// Graphiql gives user interaface to acces graphql instead of using postman/REST extension
app.use('/graphql', graphqlHTTP({
	graphiql: true,
	schema
}))
app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))