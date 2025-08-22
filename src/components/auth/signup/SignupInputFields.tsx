import React, { useState, forwardRef } from 'react';
import styles from './SignupInputFields.module.css';
import Button from '@/components/common/button/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

interface BaseProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  hasButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  error?: string;
  touched?: boolean;
  /** 주민번호 앞자리처럼 가로로 나란히 쓸 때 */
  compact?: boolean;
  /** 외부에서 에러를 렌더링할 때 내부 에러는 숨김 */
  hideError?: boolean;
}

const SignupInputField = forwardRef<HTMLInputElement, BaseProps>(
  (
    {
      icon,
      placeholder,
      hasButton = false,
      buttonText,
      onButtonClick,
      buttonDisabled = false,
      type = 'text',
      error,
      touched,
      readOnly,
      compact = false,
      hideError = false,
      ...inputProps
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const showError = !!error && !!touched;
    const showSuccess = !!touched && !error;

    return (
      <div
        className={[
          styles.row,
          compact ? styles.inlineRow : '',
        ].join(' ')}
      >
        {hasButton ? (
          <div className={styles.group}>
            <div className={styles.cellInput}>
              <div className={styles.left}>
                {icon}
                <span className={styles.bar}>&nbsp;|</span>
              </div>

              <input
                ref={ref}
                type={inputType}
                placeholder={placeholder}
                readOnly={readOnly}
                className={styles.input}
                aria-invalid={showError}
                aria-describedby={showError ? `${inputProps.name}-error` : undefined}
                {...inputProps}
              />

              {isPassword && (
                <button
                  type="button"
                  className={styles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <FaEye className={styles.iconToggle} /> : <FaEyeSlash className={styles.iconToggle} />}
                </button>
              )}
            </div>

            <div className={styles.cellBtn}>
              <Button
                type="button"
                onClick={onButtonClick}
                disabled={buttonDisabled}
                className={styles.sideBtn}
              >
                {buttonText}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={[
              styles.inputWrapper,
              showError ? styles.invalid : '',
              showSuccess ? styles.valid : '',
              readOnly ? styles.readonly : '',
            ].join(' ')}
          >
            <div className={styles.left}>
              {icon}
              <span className={styles.bar}>&nbsp;|</span>
            </div>

            <input
              ref={ref}
              type={inputType}
              placeholder={placeholder}
              readOnly={readOnly}
              className={`${styles.input} ${readOnly ? 'bg-gray-100 border-none text-gray-600' : ''}`}
              aria-invalid={showError}
              aria-describedby={showError ? `${inputProps.name}-error` : undefined}
              {...inputProps}
            />

            {isPassword && (
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <FaEye className={styles.iconToggle} /> : <FaEyeSlash className={styles.iconToggle} />}
              </button>
            )}
          </div>
        )}

        {!hideError && showError && (
          <p id={`${inputProps.name}-error`} className={styles.errorText}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default SignupInputField;
