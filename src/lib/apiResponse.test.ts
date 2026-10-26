import {describe,it,expect} from 'vitest';
import {readApi,unwrapApi,checkedResponse,readResult,ApiError,errorMessage} from './apiResponse';
describe('Backend API response contract',()=>{
    it('unwraps successful typed DTOs',async()=>{
        expect(await readApi(Response.json({code:200,message:'Thành công',data:{id:'member',fullName:'Tên mới'},errors:{}}))).toEqual({id:'member',fullName:'Tên mới'});
    });
    it('retains backend error messages and field validation',async()=>{
        const error={code:400,message:'Dữ liệu không hợp lệ',data:null,errors:{phone:'Số điện thoại đã được sử dụng'}};
        expect(await readApi(Response.json(error,{status:400}))).toEqual(error);
    });
    it('accepts unwrapped health and public test fixtures',()=>{
        expect(unwrapApi({status:'UP'})).toEqual({status:'UP'});
    });
    it('keeps the backend code and field messages without frontend translation',async()=>{
        const response=Response.json({code:409,errorCode:'IDENTITY_PHONE_ALREADY_USED',message:'Thông báo từ backend.',data:null,errors:{phone:'Lỗi chi tiết từ backend.'}},{status:409});
        const failure=await checkedResponse(response).catch(error=>error);
        expect(failure).toBeInstanceOf(ApiError);
        expect(failure).toMatchObject({status:409,errorCode:'IDENTITY_PHONE_ALREADY_USED',errors:{phone:'Lỗi chi tiết từ backend.'}});
        expect(errorMessage(failure)).toBe('Thông báo từ backend. Lỗi chi tiết từ backend.');
    });
    it('preserves backend success text for mutation notifications',async()=>{
        const result=await readResult(Response.json({code:200,message:'Đã lưu từ backend.',data:{id:'saved'},errors:{},timestamp:''}));
        expect(result.message).toBe('Đã lưu từ backend.');
        expect(result.data).toEqual({id:'saved'});
    });
    it('provides only a transport fallback when the backend cannot supply a response',()=>{
        expect(errorMessage(new TypeError('Failed to fetch'))).toContain('kết nối');
    });
});
