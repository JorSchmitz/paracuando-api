const UsersService = require('../services/users.service')
const { getPagination, getPagingData } = require('../utils/helpers')

const usersService = new UsersService()

const getUsers = async (req, res, next) => {
  try {
    let query = req.query
    let { page, size } = query

    const { limit, offset } = getPagination(page, size, '10')
    query.limit = limit
    query.offset = offset
    let users = await usersService.findAndCount(query)
    const results = getPagingData(users, page, limit)
    return res.status(200).json({ results: results })
  } catch (error) {
    next(error)
  }
}

const getUserById = async (req, res, next) => {
  try {
    const id = req.params.id
    const isSameUser = req.isSameUser
    const userRole = req.userRole
    const sameOrAdmin = 1
    if (isSameUser || userRole === 2) {
      let user = await usersService.getUser(id, sameOrAdmin)
      return res.json({ results: user })
    } else {
      let user = await usersService.getUser(id)
      return res.json({ results: user })
    }
  } catch (error) {
    next(error)
  }
}

const putUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { body } = req
    const isSameUser = req.isSameUser

    // Verify if the user trying to edit is the same as the user being edited
    if (!isSameUser) {
      return res.status(401).json({ error: 'Unauthorized' })
    } else {
      let user = await usersService.updateUser(id, body)
    }

    // Non-editable fields
    const nonEditableFields = [
      'token',
      'email_verified',
      'password',
      'email',
      'username',
    ]

    // Editable fields
    const editableFields = [
      'first_name',
      'last_name',
      'country_id',
      'code_phone',
      'phone',
      'interests',
    ]
    // Check if any non-editable fields are being edited
    const invalidFields = Object.keys(body).filter((field) =>
      nonEditableFields.includes(field)
    )
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `The following fields are not editable: ${invalidFields.join(
          ', '
        )}`,
      })
    }

    // Check if any invalid fields are being edited
    const validFields = Object.keys(body).filter((field) =>
      editableFields.includes(field)
    )
    if (validFields.length === 0) {
      return res.status(400).json({
        error: 'You must provide at least one valid field to edit',
      })
    }
    return res.json({ message: 'Success Update' })
  } catch (error) {
    next(error)
  }
}

const getUserVotes = async (req, res, next) => {
  const result = {
    results: {},
  }
  const userId = req.params.id
  const { votesPerPage, currentPage } = { votesPerPage: 4, currentPage: 1 }
  const { limit, offset } = getPagination(currentPage, votesPerPage)

  try {
    await usersService.getAuthUserOr404(userId)
    const userVotes = await usersService.findUserVotes(userId, limit, offset)
    result.results.count = userVotes.count
    result.results.totalPages = Math.ceil(userVotes.count / votesPerPage)
    result.results.CurrentPage = currentPage
    result.results.results = userVotes.rows
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

const getUserPublications = async (req, res, next) => {
  const result = {
    results: {},
  }
  const user_id = req.params.id

  const { publicationsPerPage, currentPage } = {
    publicationsPerPage: 10,
    currentPage: 1,
  }
  const { limit, offset } = getPagination(currentPage, publicationsPerPage)
  try {
    await usersService.getAuthUserOr404(user_id)
    const userPublications = await usersService.findUserPublications({
      ...req.query,
      user_id,
      limit,
      offset,
    })
    result.results.count = userPublications.count
    result.results.totalPages = Math.ceil(
      userPublications.count / publicationsPerPage
    )
    result.results.CurrentPage = currentPage
    result.results.results = userPublications.rows
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getUsers,
  getUserById,
  putUser,
  getUserVotes,
  getUserPublications,
}
