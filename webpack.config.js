const { resolve } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
// const WorkboxWebpackPlugin = require('workbox-webpack-plugin')
// 设置nodejs环境变量
process.env.NODE_ENV = 'production'

// 公共cssloader
const commonCSSLoader = [
	// 创建style标签，将js中的样式资源插入进行，添加到head中生效
	// 'style-loader',
	// 这个loader取代style-loader，作用：提取js中的css单独文件
	MiniCssExtractPlugin.loader,
	/**
	 * css兼容性处理：postcss-loader postcss-preset-env
	 * 帮postcss找到怕package.json中browserslist里面的配置，通过配置加载指定的css兼容样式
	 * 将下面代码写在package.json中
	 * 开发环境兼容最新的chrome、firefox、safari
	 * 生成环境兼容99.8%的浏览器，不兼容死掉的或者openmini的浏览器
	 * "browserslist": {
	 * 		// 开发环境 --> 设置环境变量: process.env.NODE_ENV = development
				"development": [
					"last 1 chrome version",
					"last 1 firefox version",
					"last 1 safari version"
				],
				// 生产环境
				"production": [
					">0.2%",
					"not dead",
					"not op_mini all"
				]
			}
	 */
	// 将css文件变成commonjs模块加载到js中，里面内容是字符串
	'css-loader'
]

module.exports = {
	mode: 'production',
	// 打包的入口路径
	// 单文件入口，只会打包出一个chunk
	// entry: './src/index.js',
	// 多文件入口，整合打包出一个chunk
	// entry: ["./src/index.js", "./src/test.js"],
	// 多文件入口，根据键值打包出不同的chunk
	// entry: {
	// 	main: ["./src/index.js", "./src/test.js"]
	// },
	entry: {
		main: './src/index.js'
	},
	// 输出一定是个对象
	output: {
		// 输出的文件名
		filename: 'js/[name].[contenthash:10].js',
		// 输出的路径
		path: resolve(__dirname, 'build'),
		// 输出路径的前缀，img/image.png -> /img/image.png，一般用于production环境
		publicPath: '/',
		// 非入口chunk的名称
		chunkFilename: 'js/[name]_[contenthash:10]_chunk.js',
		// 将导出文件暴露个接口出去
		library: '[name]',
		// 将暴露的接口作为属性赋值给window
		libraryTarget: 'commonjs'
	},
	// loader的配置
	module: {
		rules: [
			// {
			// 	/**
			// 	 * 语法检查：eslint-loader
			// 	 * 注意：只检查自己的源代码，第三方的库是不用检查的
			// 	 * 设置检查规则
			// 	 * package.json中的eslintConfig中设置~
			// 	 * "eslintConfig": {
			// 				"extends": "airbnb-base"
			// 			}
			// 	 * airbnb --> eslint-config-airbnb-base eslint eslint-plugin-import eslint-loader 四个包
			// 	 */
			// 	test: /\.js$/,
			// 	exclude: /node_modules/,
			// 	loader: 'eslint-loader',
			//	// 优先执行
			//  enforce: 'pre'
			// 	options: {
			// 		// 自动修复eslint的错误，将项目开发文件矫正成功
			// 		fix: true
			// 	}
			// },
			{
				/**
				 * 以下loader只会匹配其中一个
				 * 注意：不能有两个配置处理同一种文件
				 */
				oneOf: [
					// 详细的loader配置
					{
						// 匹配哪些文件
						test: /\.css$/,
						// 使用哪些loader
						// use执行顺序为从下往上，从右往左执行
						use: [
							...commonCSSLoader,
							'postcss-loader'
						]
					},
					{
						test: /\.less$/,
						use: [
							...commonCSSLoader,
							// 将less转为css文件
							'less-loader'
						]
					},
					{
						/**
						 * scss、sass处理器
						 * 安装的依赖：sass、sass-loader
						 */
						test: /\.(scss|sass)$/,
						use: [
							...commonCSSLoader,
							// 将less转为css文件
							'sass-loader'
						]
					},
					{
						/**
						 * js兼容性处理：babel-loader
						 * 需要的包：babel-loader @babel/core
						 * 基本js兼容性处理：@babel/preset-env，缺点：仅含有基础的api兼容
						 * 按需js兼容处理：corejs
						 * 全部js兼容性处理：@babel/polyfill，缺点：包打包太大了
						 */
						test: /\.js$/,
						exclude: /node_modules/,
						use: [
							/**
							 * 开启多进程打包
							 * 进程启动大概为600ms，进程通信也有开销
							 * 只有工作消耗时间长，才需要多进程打包
							 */
							{
								loader: 'thread-loader',
								options: {
									workers: 2 // 进程2个
								}
							},
							{
								loader: 'babel-loader',
								options: {
									// 预设：指示babel做怎样的兼容性处理
									presets: [
										[
											'@babel/preset-env',
											{
												// 按需加载
												useBuiltIns: 'usage',
												// 指定core-js版本
												corejs: {
													version: 3
												},
												// 指定兼容性做到哪个版本的浏览器
												targets: {
													chrome: '60',
													firefox: '50',
													ie: '9',
													safari: '10',
													edge: '17'
												}
											}
										]
									],
									/**
									 * 开启babel缓存
									 * 第二次构建时，只会读取之前的缓存
									 */
									cacheDirectory: true
								}
							}
						]
					},
					{
						// 处理图片资源
						// 问题：处理不了html中的图片
						test: /\.(jpe?g|png|gif|svg)$/,
						// 只使用一个loader就可以不需要使用use
						use: [
							{
								// 下载: url-loader file-loader
								loader: 'url-loader',
								options: {
									// 图片大小小于8kb，就会被base64处理
									// 优点：减少请求数量（减轻服务器压力）
									// 缺点：图片体积会更大（文件请求速度更慢）
									limit: 8 * 1024,
									// 问题：因为url-loader默认使用es6模块解析，而html-loader引入图片是commonjs
									// 解析时会出问题：[object module]
									// 解决：关闭url-loader的es6模块，使用commonjs解析
									esModule: false,
									// 给图片进行重命名
									// [hash:10]取图片的hash的前10位
									// [ext]取文件原来的扩展名
									name: '[hash:10].[ext]',
									// 输出路径
									outputPath: 'image'
								},
							},
							/**
							 * 图片压缩，一定要放到图片生成之前
							 */
							'image-webpack-loader'
						]
					},
					{
						// 打包其他资源
						// 排除其他资源，和test一样使用正则，不过是排除掉这些资源，其他资源皆可使用loader
						exclude: /\.(js|css|html|less|scss|json|jpg|png|gif|svg)$/,
						loader: 'file-loader',
						options: {
							name: '[hash:10].[ext]',
							outputPath: 'assets'
						}
					},
					{
						test: /\.html$/,
						// 处理html文件的img图片（负责引入img，从而能被url-loader进行处理）
						loader: 'html-loader'
					}
				]
			}
		]
	},
	// plugins的配置
	plugins: [
		// 详细的plugins配置
		// html-webpack-plugin
		// 功能：默认会创建一个空的HTML，自动引入打包输出的所有资源（JS/CSS）
		new HtmlWebpackPlugin({
			// 复制 './src/index.html'的内容到导出的html中
			template: './src/index.html',
			// 压缩html，一般设置mode为production就已经生效了，这里可以不用管
			minify: {
				// 移除空格
				collapseWhitespace: true,
				// 移除注释
				removeComments: true
			}
		}),
		new MiniCssExtractPlugin({
			// 对输出的文件重命名
			filename: 'css/main.[contenthash:10].css'
		}),
		// 压缩css代码
		new OptimizeCssAssetsWebpackPlugin(),
		// 渐进式网络插件
		// new WorkboxWebpackPlugin.GenerateSW({
		// 	/**
		// 	 * 帮助serviceworker快速启动
		// 	 * 删除就的serviceworker
		// 	 * 
		// 	 * 生成servbiceworker配置文件
		// 	 */
		// 	clientsClaim: true,
		// 	removeComments: true
		// })
	],
	/**
	 * 可以将node_modules中代码单独打包一个chunk最终输出
	 * 自动分析多入口chunk中有没有公共的文件，如果有，会打包成单独一个chunk
	 */
	optimization: {
		splitChunks: {
			chunks: 'all',
			// 以下为默认值
			// // 分割的串最小为30kb
			// minSize: 30 * 1024,
			// // 最大没有限制
			// maxSize: 0,
			// // 要提取的chunk最少被引用一次
			// minChunks: 1,
			// // 按需加载时并行加载的文件的最大数量
			// maxAsyncRequest: 5,
			// // 入口js文件最大并行请求数量
			// maxInitialRequests: 3,
			// // 名称连接符
			// automaticNameDelimiter: '~',
			// // 可以使用命名规则
			// name: true,
			// // 分割chunk组
			// cacheGroups: {
			// 	// node_modules文件会被打包到vendors组的chunk中 --> vendors~xxx.js
			// 	vendors: {
			// 		test: /[\\/]node_modules[\\/]/,
			// 		// 优先级
			// 		priority: -10
			// 	},
			// 	default: {
			// 		// 要提取的chunk最少被引用2次
			// 		minChunks: 2,
			// 		// 优先级
			// 		priority: -20,
			// 		// 如果当前要打包的模块和之前已经被提取的模块是同一个，就会复用，而不是重新打包模块
			// 		reuseExistingChunk: true
			// 	}
			// }
		},
		/**
		 * 将当前模块的记录其他模块的hash单独打包为一个文件：runtime
		 * 解决：a.js引入了b.js，因此a.js会保留b.js的hash引用，当b.js修改了之后，a.js文件也会被修改，导致缓存失
		 * 因此通过该方法将hash引用提取出来，再次改变b.js的时候就仅仅只会修改b.js与hash引用文件
		 */
		runtimeChunk: {
			name: entrypoint => `runtime-${entrypoint.name}`
		},
		// 配置生产环境的js、css压缩
		minimizer: [
			new TerserWebpackPlugin({
				// 开启缓存
				cache: true,
				// 开启多进程打包
				parallel: true,
				// 启动source-map
				sourceMap: true
			})
		]
	},
	// 开发服务器 devServer：用来自动化（自动编译。自动打开浏览器，自动刷新浏览器~）
	// 特点：智慧在内存中编译打包，不会有任何输出
	// 启动devsServer指令为：webpack-dev-server
	devServer: {
		// 服务监听构建后的项目路径
		contentBase: resolve(__dirname, 'build'),
		// 监听目录下的所有文件，一旦变化就会reload
		watchContentBase: true,
		watchOptions: {
			// 忽略文件
			ignored: /node_modules/
		},
		// 启动gzip压缩
		compress: true,
		// 端口号
		port: 3000,
		// 域名
		host: 'localhost',
		// 不显示启动服务器的日志信息
		clientLogLevel: 'none',
		// 除了一些基本启动信息以外，其他内容都不要显示
		quiet: true,
		// 如果出错了不要进行全屏提示
		overlay: true,
		// 自动打开浏览器
		open: true,
		/**
		 * 开启HMR功能
		 * 作用：只更新修改的模块
		 * 局限性：js、html不能使用hmr功能
		 * 解决：entry入口将html文件引入
		 */
		hot: true,
		//服务器代理 --> 解决开发环境跨域问题
		proxy: {
			// 一旦devServer（5000）服务器接收到/api/xxx请求，就会把请求转发到另外一个服务器(3000)
			'/api': {
				target: "http://localhost:3000",
				// 发送请求时，将请求路径重写/api/xxx -> /api
				pathRewrite: {
					'^/api': ''
				}
			}
		}
	},
	/**
	 * 一种提供源代码到构建后代码映射技术，方便在浏览器控制台看到错误信息
	 * inline-source-map: 内联
	 * 只生成一个内联source-map
	 * 错误代码准确信息和源代码的错误信息
	 * hidden-source-map: 外部
	 * 错误代码错误原因，但没有错误位置
	 * 不能追踪源代码错误，只能提示构建后代码的错误位置
	 * eval-source-map: 内联
	 * 每个文件都会生成对应的source-map，都在eval
	 * 错误代码准确信息和源代码的错误位置
	 * nosources-source-map: 外部
	 * 有错误代码准确信息，但没有源代码
	 * cheap-source-map： 外部
	 * 错误代码准确信息和源代码的错误位置
	 * 但是只能精确到行，不能精确到行内的哪一个错误
	 * cheap-module-source-map：外部
	 * 错误代码准确信息和源代码的错误位置
	 * 但是只能精确到行，不能精确到行内的哪一个错误
	 * 
	 * 开发环境:
	 * 
	 * 速度比较
	 * (eval > line > cheap)
	 * 调试友好
	 * source-map
	 * cheap-module-source-map
	 * cheap-source-map
	 * 
	 * 最终选择：eval-source-map
	 * 
	 * 生产环境
	 * 
	 * 避免使用内联，代码体积过大
	 * 
	 * 隐藏源代码：hidden-source-map，会提示构建错误信息
	 * 
	 * source-map / cheap-module-source-map
	 */
	devtool: 'source-map',
	// 解析模块规则
	resolve: {
		// 配置解析模块路径别名
		alias: {
			"@": resolve(__dirname, 'src')
		},
		// 配置省略文件路径的后缀名
		extensions: ['.js', 'json', 'css', 'scss', 'less', 'vue'],
		// 告诉webpack解析模块是去哪个目录找
		modules: [resolve(__dirname, 'node_modules')]
	},
	/**
	 * 拒绝打包
	 * 如果要引入的话，需要手动引入（cdn）
	 */
	externals: {
		jquery: 'jQuery'
	}
}