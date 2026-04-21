import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  upload,
  listProjects, createProject, updateProject, deleteProject,
  getDomain, saveDomain,
  getPalette, savePalette,
  getMessages, saveMessages,
  getFiles, saveFiles,
  listImages, uploadImage, renameImage, deleteImage,
  listCheckpoints, createCheckpoint, renameCheckpoint, deleteCheckpoint,
  listPublishedIds, getPublished, publishToDomain, publishToSubdomain,
  checkSubdomainAvailability, saveSubdomain,
} from '../handlers/projectHandlers.js'

const router = Router()

// Projects CRUD
router.get('/projects', requireAuth, listProjects)
router.post('/projects', requireAuth, createProject)
router.patch('/projects/:id', requireAuth, updateProject)
router.delete('/projects/:id', requireAuth, deleteProject)

// Domain
router.get('/projects/:id/domain', requireAuth, getDomain)
router.put('/projects/:id/domain', requireAuth, saveDomain)

// Palette
router.get('/projects/:id/palette', requireAuth, getPalette)
router.put('/projects/:id/palette', requireAuth, savePalette)

// Messages
router.get('/projects/:id/messages', requireAuth, getMessages)
router.put('/projects/:id/messages', requireAuth, saveMessages)

// Files
router.get('/projects/:id/files', requireAuth, getFiles)
router.put('/projects/:id/files', requireAuth, saveFiles)

// Images
router.get('/projects/:id/images', requireAuth, listImages)
router.post('/projects/:id/images', requireAuth, upload.single('file'), uploadImage)
router.patch('/projects/:id/images/:imageId', requireAuth, renameImage)
router.delete('/projects/:id/images/:imageId', requireAuth, deleteImage)

// Checkpoints
router.get('/projects/:id/checkpoints', requireAuth, listCheckpoints)
router.post('/projects/:id/checkpoints', requireAuth, createCheckpoint)
router.patch('/projects/:id/checkpoints/:checkpointId', requireAuth, renameCheckpoint)
router.delete('/projects/:id/checkpoints/:checkpointId', requireAuth, deleteCheckpoint)

// Published site
router.get('/projects/published-ids', requireAuth, listPublishedIds)
router.get('/projects/:id/published', requireAuth, getPublished)
router.put('/projects/:id/published', requireAuth, publishToDomain)
router.put('/projects/:id/published/subdomain', requireAuth, publishToSubdomain)

// Subdomain
router.get('/subdomains/check', checkSubdomainAvailability)
router.put('/projects/:id/subdomain', requireAuth, saveSubdomain)

export { router as projectsRoute }
