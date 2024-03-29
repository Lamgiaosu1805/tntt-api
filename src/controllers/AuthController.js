const UserModel = require("../models/UserModel");
const bcrypt = require('bcrypt');
const ValidateCodeEmailModel = require("../models/ValidateCodeEmailModel");
const nodemailer = require('nodemailer')

const generateOTP = () => {
    const randomInt = Math.floor(Math.random() * 1000000);
    return randomInt.toString().padStart(6, '0');
}

const sendValidateMail = async (mail, OTP) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        })
        await transporter.sendMail({
            from: "TNTT_VN",
            to: mail,
            subject: "Xác minh tài khoản",
            text: "xác minh tài khoản",
            html: `
            <div>
                <p>OTP xác minh tài khoản của bạn là ${OTP}</p>
            </div>
            `
        })
        return {status: true, message: "send mail success"}
    } catch (error) {
        console.log("error", error)
        return {status: false, message: "send mail failure"}
    }
}
  
const AuthController = {
    signUp: async (req, res, next) => {
        try {
            const {body} = req
            const user = await UserModel.findOne({mail: body.mail})
            if(user && user.isValidated) {
                res.json({
                    status: false,
                    message: "mail đã được sử dụng"
                })
            }
            else if(user && !user.isValidated) {
                await user.updateOne({
                    password: await bcrypt.hash(body.password, 10),
                    saintName: body.saintName,
                    fullName: body.fullName,
                    giaoPhan: body.giaoPhan,
                    giaoHat: body.giaoHat,
                    giaoXu: body.giaoXu,
                    sex: body.sex,
                });
                const verifyCode = generateOTP();
                const validateCode = await ValidateCodeEmailModel.findOne({userId: user._id});
                if(validateCode) {
                    await ValidateCodeEmailModel.updateOne({userId: user._id}, {validateCode: verifyCode})
                }
                else {
                    const validateCodeNew = new ValidateCodeEmailModel({
                        userId: user._id,
                        validateCode: verifyCode
                    })
                    await validateCodeNew.save();
                }
                res.json({
                    status: true,
                    message: "Đã thay thế tài khoản có email chưa validate",
                })
                
                await sendValidateMail(user.mail, verifyCode);
            }
            else {
                const user = new UserModel({
                    mail: body.mail,
                    password: await bcrypt.hash(body.password, 10),
                    saintName: body.saintName,
                    fullName: body.fullName,
                    giaoPhan: body.giaoPhan,
                    giaoHat: body.giaoHat,
                    giaoXu: body.giaoXu,
                    sex: body.sex,
                    role: 4,
                })
                await user.save();
                const verifyCode = generateOTP();
                const validateCodeNew = new ValidateCodeEmailModel({
                    userId: user._id,
                    validateCode: verifyCode
                })
                await validateCodeNew.save();
                res.json({
                    status: true,
                    message: "Tạo tài khoản thành công"
                })
                await sendValidateMail(user.mail, verifyCode);
            }
        } catch (error) {
            console.log(error)
            res.json({
                status: false,
                message: "Đã có lỗi trong quá trình đăng ký tài khoản",
                error: error
            })
        }
    },
    validateOTP: async (req, res, next) => {
        
    }
}

module.exports = AuthController;