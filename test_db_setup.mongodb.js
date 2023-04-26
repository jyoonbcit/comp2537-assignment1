use('sample');

/**
db.getCollection('users').insertMany([
    {
        name: 'admin',
        email: 'admin@admin.com',
        password: 'admin'
    }
]);
*/

db.users.updateOne(
    {
        email: 'admin@admin.com'
    },
    {
        $set: {
            password: '$2b$10$Z70/Lry.BybWclXtDsOo3O29yZO7lGXfEIuoukMtdd/4mNODSrppi'
        }
    }
)

db.users.find();