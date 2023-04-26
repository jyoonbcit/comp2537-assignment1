// Main function needs to be called after inputting environment variables
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(`localhost:3000/assignment1`);
    console.log("connected to db");
    app.listen(process.env.PORT || 3000, () => {
        console.log('Server is running!')
    })
}