import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUser,
  updateAvatar,
  updateCoverImage,
  testFunction,
  getUserChannelProfile,
  doSubscribe,
  doUnsubscribe,
  getWatchHistory,
  addVideo,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { jwtVerify } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/test").get(testFunction);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Secured routes
router.route("/logout").post(jwtVerify, logoutUser);
router.route("/change-password").post(jwtVerify, changeCurrentPassword);
router.route("/user").get(jwtVerify, getCurrentUser);
router.route("/user").patch(jwtVerify, updateUser);
router.route("/avatar").patch(jwtVerify, upload.single("avatar"), updateAvatar);
router
  .route("/cover-image")
  .patch(jwtVerify, upload.single("coverImage"), updateCoverImage);
router.route("/profile").get(jwtVerify, getUserChannelProfile);
router.route("/do-subscribe").post(jwtVerify, doSubscribe);
router.route("/do-unsubscribe").post(jwtVerify, doUnsubscribe);
router.route("/add-video").post(
  jwtVerify,
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  addVideo
);
router.route("/watch-history").get(jwtVerify, getWatchHistory);

export default router;
