const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const devCerts = require("office-addin-dev-certs");

module.exports = async (env, options) => {
    const isDev = options.mode !== "production";
    const config = {
        entry: {
            taskpane: "./src/taskpane/index.tsx",
        },
        output: {
            clean: true,
        },
        resolve: {
            extensions: [".ts", ".tsx", ".html", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: "ts-loader",
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                filename: "taskpane.html",
                template: "./src/taskpane/taskpane.html",
                chunks: ["taskpane"],
            }),
        ],
        devServer: {
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            server: {
                type: "https",
                options: await devCerts.getHttpsServerOptions(),
            },
            port: 3000,
        },
    };

    return config;
};
