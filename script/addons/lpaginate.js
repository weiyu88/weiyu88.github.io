/**
 * Created by vsa on 5/10/15.
 */
/**
 * Creates a new `Paginate` form a givin `Array`,
 * optionally with a specific `Number` of items per page.
 *
 * @param {Array} data
 * @param {Number} [perPage=10]
 * @constructor
 * @api public
 */
function Paginate (data, perPage) {
    if (!data) throw new Error('Required Argument Missing')
    if (!(data instanceof Array)) throw new Error('Invalid Argument Type')
    this.dtpage = data
    this.perPage = perPage || 10
    this.currentPage = 0
    this.totalPages = Math.ceil(this.dtpage.length / this.perPage)
}
Paginate.prototype.offset = function () {
    return ((this.currentPage - 1) * this.perPage);
}
Paginate.prototype.page = function (pageNum) {
    if (pageNum < 1) pageNum = 1
    if (pageNum > this.totalPages) pageNum = this.totalPages
    this.currentPage = pageNum
    var start = this.offset()
        , end = start + this.perPage
    return this.dtpage.slice(start, end);
}
Paginate.prototype.next = function () {
    return this.page(this.currentPage + 1);
}
Paginate.prototype.prev = function () {
    return this.page(this.currentPage - 1);
}
Paginate.prototype.hasNext = function () {
    return (this.currentPage < this.totalPages)
}
if (typeof module !== 'undefined') module.exports = Paginate