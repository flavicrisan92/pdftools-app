import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle, Crown, Calendar, Mail, Loader2, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import type { UserPlan } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL;

interface UserData {
  plan: UserPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
}

export function Account() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [managingSubscription, setManagingSubscription] = useState(false);

  const sessionId = searchParams.get('session_id');

  const handleManageSubscription = async () => {
    if (!userData?.stripeCustomerId) return;

    setManagingSubscription(true);
    try {
      const response = await fetch(`${API_URL}/createPortalSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: userData.stripeCustomerId,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Unable to open subscription management. Please try again.');
    } finally {
      setManagingSubscription(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      setShowSuccess(true);
      // Remove session_id from URL after showing success
      const timer = setTimeout(() => {
        navigate('/account', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          setUserData({ plan: 'free' });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData({ plan: 'free' });
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchUserData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Please log in to view your account
        </h1>
        <Button onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  const isPro = userData?.plan === 'pro';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {showSuccess && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-2">
              Payment Successful!
            </h2>
            <p className="text-green-700">
              Thank you for upgrading to Pro! Your account has been upgraded and you now have unlimited access to all PDF tools.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      {/* User Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="w-5 h-5" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>

        {isPro ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Crown className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Pro Plan</p>
                <p className="text-sm text-gray-500">
                  {userData?.subscriptionStatus === 'active' ? 'Active subscription' : 'Unlimited access to all features'}
                </p>
              </div>
            </div>
            {userData?.stripeCustomerId && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={managingSubscription}
              >
                {managingSubscription ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Manage Subscription
                  </span>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-3 rounded-full">
                <Crown className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Free Plan</p>
                <p className="text-sm text-gray-500">3 operations per day</p>
              </div>
            </div>
            <Button onClick={() => navigate('/pricing')} variant="primary">
              Upgrade to Pro
            </Button>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Tools</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => navigate('/merge')}>
            Merge PDFs
          </Button>
          <Button variant="outline" onClick={() => navigate('/split')}>
            Split PDF
          </Button>
          <Button variant="outline" onClick={() => navigate('/compress')}>
            Compress PDF
          </Button>
          <Button variant="outline" onClick={() => navigate('/convert')}>
            Convert PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
