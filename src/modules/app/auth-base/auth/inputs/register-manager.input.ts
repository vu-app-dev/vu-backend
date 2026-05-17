import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CompanyIndustryEnum } from '../../../companies/enums/company-industry.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserInput {
  @ApiProperty({
    example: 'manager@acme.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'StrongPass1',
    minLength: 8,
    maxLength: 20,
    description:
      'Password with at least one uppercase and one lowercase letter',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20, { message: 'Password must between 8 and 20 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])/, {
    message:
      'Password must contain at least one uppercase and one lowercase letter',
  })
  password: string;

  @ApiProperty({
    example: 'StrongPass1',
    minLength: 8,
    maxLength: 20,
    description: 'Must match password',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20, {
    message: 'Confirm Password must between 8 and 20 characters',
  })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])/, {
    message:
      'Confirm Password must contain at least one uppercase and one lowercase letter',
  })
  confirmPassword: string;

  @ApiProperty({ example: 'Aya', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Hassan', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: '+201001234567',
    description: 'Phone number in international format',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({
    example: 'HR Specialist',
    description: 'User job title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/profiles/aya.jpg',
    description: 'Optional profile image URL',
  })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;
}

export class CreateCompanyInput {
  @ApiProperty({ example: 'Acme Labs', description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: CompanyIndustryEnum,
    example: CompanyIndustryEnum.TECH,
    description: 'Company industry',
  })
  @IsEnum(CompanyIndustryEnum)
  industry: CompanyIndustryEnum;

  @ApiPropertyOptional({
    example: 'https://acme.com',
    description: 'Company website',
  })
  @IsOptional()
  @IsUrl()
  @IsNotEmpty()
  website?: string;

  @ApiPropertyOptional({
    example: '+201009876543',
    description: 'Company phone number',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/logos/acme.png',
    description: 'Company logo URL',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'We build AI-based hiring products.',
    maxLength: 255,
    description: 'Short company description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class RegisterManagerInput {
  @ApiProperty({
    type: () => RegisterUserInput,
    description: 'Manager account details',
  })
  @ValidateNested()
  @Type(() => RegisterUserInput)
  userInput: RegisterUserInput;

  @ApiProperty({
    type: () => CreateCompanyInput,
    description: 'Company details to create',
  })
  @ValidateNested()
  @Type(() => CreateCompanyInput)
  companyInput: CreateCompanyInput;
}
