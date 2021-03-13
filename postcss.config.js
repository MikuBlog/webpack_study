// 解决postcss不兼容问题
module.exports = {
  plugins: [
    require('postcss-preset-env')()
  ]
}