//maps the url to the function/file that needs to be executed
module.exports = (app) => {
    app.use("/", require("./routes/index.js"))
}
